"""Authentication controller"""

from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.orm import Session

from dependencies import (
    get_api_key,
    get_client_info,
    get_current_admin_user,
    get_current_user,
    get_db,
)
from exceptions import NotFoundError, ValidationError
from repositories import UserRepository
from schemas import (
    ChangePasswordRequest,
    ChangePasswordResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    GenerateResetLinkResponse,
    PasswordResetItemResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    TokenResponse,
    UserCreateAdmin,
    UserLogin,
    UserRegister,
    UserResponse,
    UserUpdate,
)
from services import UserService
from utils.auth import create_access_token

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
def register(
    user_data: UserRegister,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Register a new user"""
    user_repository = UserRepository(db)
    service = UserService(user_repository)
    try:
        # When user registers themselves, created_by is their own name
        user = service.create_user(
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name,
            user_name=user_data.full_name or user_data.email,
        )
        return user
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.post("/login", response_model=TokenResponse)
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Authenticate user and return JWT token"""
    user_repository = UserRepository(db)
    service = UserService(user_repository)
    try:
        user = service.authenticate_user(email=credentials.email, password=credentials.password)
        access_token = create_access_token(data={"sub": user.email, "user_id": user.id})
        return TokenResponse(
            access_token=access_token, token_type="bearer", user_id=user.id, email=user.email
        )
    except ValidationError as e:
        raise HTTPException(status_code=401, detail=str(e)) from None


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Request a password reset token"""
    user_repository = UserRepository(db)
    service = UserService(user_repository)
    try:
        result = service.request_password_reset(request.email)
        return ForgotPasswordResponse(
            message=result["message"],
            email_sent=result.get("email_sent", False),
            token=result.get("token"),
        )
    except Exception:
        # Always return success message for security (don't reveal if user exists)
        return ForgotPasswordResponse(
            message="If the email exists, a password reset link has been sent", email_sent=False
        )


@router.post("/reset-password", response_model=ResetPasswordResponse)
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
    api_key: str = Security(get_api_key),
    client_info: str | None = Depends(get_client_info),
):
    """Reset password using a reset token"""
    user_repository = UserRepository(db)
    service = UserService(user_repository)
    try:
        result = service.reset_password(token=request.token, new_password=request.new_password)
        return ResetPasswordResponse(message=result["message"])
    except (ValidationError, NotFoundError) as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user=Depends(get_current_user),
):
    """Get current authenticated user"""
    return current_user


@router.post("/change-password", response_model=ChangePasswordResponse)
def change_password(
    request: ChangePasswordRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change password for authenticated user"""
    user_repository = UserRepository(db)
    service = UserService(user_repository)
    try:
        result = service.change_password(
            current_user.id, request.current_password, request.new_password
        )
        return ChangePasswordResponse(message=result["message"])
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.get("/users", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_user),
):
    """List all users (admin only)"""
    user_repository = UserRepository(db)
    users = user_repository.get_all()
    return users


@router.post("/users", response_model=UserResponse)
def create_user_admin(
    user_data: UserCreateAdmin,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_user),
):
    """Create a new user (admin only)"""
    user_repository = UserRepository(db)
    service = UserService(user_repository)
    try:
        user = service.create_user(
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name,
            user_name=current_user.full_name or current_user.email,
            is_active=user_data.is_active if user_data.is_active is not None else True,
            is_admin=user_data.is_admin if user_data.is_admin is not None else False,
        )
        return user
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_user),
):
    """Get a specific user by ID (admin only)"""
    user_repository = UserRepository(db)
    service = UserService(user_repository)
    try:
        return service.get_user_by_id(user_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_user),
):
    """Update a user (admin only)"""
    user_repository = UserRepository(db)
    service = UserService(user_repository)
    try:
        update_data = user_update.model_dump(exclude_unset=True)
        return service.update_user(
            user_id, update_data, current_user.full_name or current_user.email
        )
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_user),
):
    """Delete a user (admin only)"""
    user_repository = UserRepository(db)
    service = UserService(user_repository)
    try:
        user = service.get_user_by_id(user_id)
        # Prevent deleting yourself
        if user.id == current_user.id:
            raise ValidationError("Cannot delete your own account")
        user_repository.delete(user)
        return {"message": "User deleted successfully"}
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.get("/password-resets", response_model=list[PasswordResetItemResponse])
def list_password_resets(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_user),
):
    """List all active password reset requests (admin only)"""
    user_repository = UserRepository(db)
    service = UserService(user_repository)
    return service.get_active_password_resets()


@router.post("/users/{user_id}/generate-reset-link", response_model=GenerateResetLinkResponse)
def generate_reset_link(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_user),
):
    """Generate a password reset link for a specific user (admin only)"""
    user_repository = UserRepository(db)
    service = UserService(user_repository)
    try:
        return service.generate_reset_link_for_user(user_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None
