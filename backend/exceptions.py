"""Custom exceptions for business logic"""


class NotFoundError(Exception):
    """Raised when a resource is not found"""

    pass


class ValidationError(Exception):
    """Raised when validation fails"""

    pass


class ConflictError(Exception):
    """Raised when there's a conflict (e.g., duplicate name)"""

    pass


class DependencyError(Exception):
    """Raised when trying to delete a resource that has dependencies"""

    def __init__(self, message: str, count: int = 0):
        self.message = message
        self.count = count
        super().__init__(self.message)
