import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useResponsive, getResponsiveValue, responsive } from "../useResponsive";
import { setMockDimensions, resetMockDimensions } from "../../test/__mocks__/react-native";

describe("useResponsive", () => {
  beforeEach(() => {
    resetMockDimensions();
  });

  describe("device type detection", () => {
    it("should detect phone for width < 768px", () => {
      setMockDimensions({ width: 375, height: 667 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isPhone).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.deviceType).toBe("phone");
    });

    it("should detect tablet for width >= 768px", () => {
      setMockDimensions({ width: 768, height: 1024 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isPhone).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.deviceType).toBe("tablet");
    });

    it("should detect tablet for large iPad Pro", () => {
      setMockDimensions({ width: 1024, height: 1366 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isTablet).toBe(true);
      expect(result.current.deviceType).toBe("tablet");
    });
  });

  describe("orientation detection", () => {
    it("should detect portrait when height > width", () => {
      setMockDimensions({ width: 375, height: 667 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isPortrait).toBe(true);
      expect(result.current.isLandscape).toBe(false);
      expect(result.current.orientation).toBe("portrait");
    });

    it("should detect landscape when width > height", () => {
      setMockDimensions({ width: 667, height: 375 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isPortrait).toBe(false);
      expect(result.current.isLandscape).toBe(true);
      expect(result.current.orientation).toBe("landscape");
    });

    it("should detect portrait when width equals height", () => {
      setMockDimensions({ width: 500, height: 500 });

      const { result } = renderHook(() => useResponsive());

      // width > height is false when equal, so it's portrait
      expect(result.current.isLandscape).toBe(false);
      expect(result.current.isPortrait).toBe(true);
    });
  });

  describe("wide screen detection", () => {
    it("should not be wide screen for width < 900px", () => {
      setMockDimensions({ width: 899, height: 600 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isWideScreen).toBe(false);
    });

    it("should be wide screen for width >= 900px", () => {
      setMockDimensions({ width: 900, height: 600 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isWideScreen).toBe(true);
    });

    it("should be wide screen for typical Mac window", () => {
      setMockDimensions({ width: 1280, height: 800 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isWideScreen).toBe(true);
    });
  });

  describe("ultra-wide screen detection", () => {
    it("should not be ultra-wide for width < 1600px", () => {
      setMockDimensions({ width: 1599, height: 900 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isUltraWide).toBe(false);
    });

    it("should be ultra-wide for width >= 1600px", () => {
      setMockDimensions({ width: 1600, height: 900 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isUltraWide).toBe(true);
    });

    it("should be ultra-wide for large iMac display", () => {
      setMockDimensions({ width: 2560, height: 1440 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isUltraWide).toBe(true);
    });
  });

  describe("column calculations", () => {
    it("should return 1 column for phones", () => {
      setMockDimensions({ width: 375, height: 667 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.columns).toBe(1);
    });

    it("should return 2 columns for tablets in portrait", () => {
      setMockDimensions({ width: 768, height: 1024 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.columns).toBe(2);
    });

    it("should return 3 columns for tablets in landscape", () => {
      setMockDimensions({ width: 1024, height: 768 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.columns).toBe(3);
    });
  });

  describe("card columns", () => {
    it("should return 2 card columns for phones", () => {
      setMockDimensions({ width: 375, height: 667 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.cardColumns).toBe(2);
    });

    it("should return 4 card columns for tablets", () => {
      setMockDimensions({ width: 768, height: 1024 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.cardColumns).toBe(4);
    });
  });

  describe("max content width", () => {
    it("should return screen width for phones", () => {
      setMockDimensions({ width: 375, height: 667 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.maxContentWidth).toBe(375);
    });

    it("should return 1200 for tablets", () => {
      setMockDimensions({ width: 1024, height: 768 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.maxContentWidth).toBe(1200);
    });
  });

  describe("master-detail layout", () => {
    it("should not use master-detail for phones", () => {
      setMockDimensions({ width: 375, height: 667 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.useMasterDetail).toBe(false);
    });

    it("should not use master-detail for small tablets in portrait", () => {
      setMockDimensions({ width: 768, height: 1024 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.useMasterDetail).toBe(false);
    });

    it("should not use master-detail for small tablets in landscape", () => {
      setMockDimensions({ width: 1000, height: 700 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.useMasterDetail).toBe(false);
    });

    it("should use master-detail for large tablets in landscape", () => {
      setMockDimensions({ width: 1366, height: 1024 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.useMasterDetail).toBe(true);
    });
  });

  describe("spacing multiplier", () => {
    it("should return 1 for phones", () => {
      setMockDimensions({ width: 375, height: 667 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.spacingMultiplier).toBe(1);
    });

    it("should return 1.25 for tablets", () => {
      setMockDimensions({ width: 768, height: 1024 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.spacingMultiplier).toBe(1.25);
    });
  });

  describe("dimension values", () => {
    it("should return correct width and height", () => {
      setMockDimensions({ width: 1024, height: 768 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.width).toBe(1024);
      expect(result.current.height).toBe(768);
    });
  });

  describe("real-world device scenarios", () => {
    it("should handle iPhone SE", () => {
      setMockDimensions({ width: 375, height: 667 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current).toMatchObject({
        isPhone: true,
        isTablet: false,
        isPortrait: true,
        isWideScreen: false,
        isUltraWide: false,
        columns: 1,
        useMasterDetail: false,
      });
    });

    it("should handle iPhone 15 Pro Max", () => {
      setMockDimensions({ width: 430, height: 932 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current).toMatchObject({
        isPhone: true,
        isTablet: false,
        isPortrait: true,
        isWideScreen: false,
        isUltraWide: false,
        columns: 1,
      });
    });

    it("should handle iPhone in landscape", () => {
      setMockDimensions({ width: 932, height: 430 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current).toMatchObject({
        isPhone: false, // Width >= 768 makes it tablet
        isLandscape: true,
        isWideScreen: true,
        isUltraWide: false,
      });
    });

    it("should handle iPad Mini portrait", () => {
      setMockDimensions({ width: 768, height: 1024 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current).toMatchObject({
        isTablet: true,
        isPortrait: true,
        isWideScreen: false,
        isUltraWide: false,
        columns: 2,
        useMasterDetail: false,
      });
    });

    it("should handle iPad Mini landscape", () => {
      setMockDimensions({ width: 1024, height: 768 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current).toMatchObject({
        isTablet: true,
        isLandscape: true,
        isWideScreen: true,
        isUltraWide: false,
        columns: 3,
        useMasterDetail: true,
      });
    });

    it("should handle iPad Pro 12.9 portrait", () => {
      setMockDimensions({ width: 1024, height: 1366 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current).toMatchObject({
        isTablet: true,
        isPortrait: true,
        isWideScreen: true,
        isUltraWide: false,
        useMasterDetail: false,
      });
    });

    it("should handle iPad Pro 12.9 landscape", () => {
      setMockDimensions({ width: 1366, height: 1024 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current).toMatchObject({
        isTablet: true,
        isLandscape: true,
        isWideScreen: true,
        isUltraWide: false,
        useMasterDetail: true,
      });
    });

    it("should handle Mac (Designed for iPad) typical window", () => {
      setMockDimensions({ width: 1280, height: 800 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current).toMatchObject({
        isTablet: true,
        isLandscape: true,
        isWideScreen: true,
        isUltraWide: false,
        useMasterDetail: true,
      });
    });

    it("should handle Mac fullscreen on 27-inch iMac", () => {
      setMockDimensions({ width: 2560, height: 1440 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current).toMatchObject({
        isTablet: true,
        isLandscape: true,
        isWideScreen: true,
        isUltraWide: true,
        useMasterDetail: true,
      });
    });

    it("should handle Mac fullscreen on MacBook Pro 16-inch", () => {
      setMockDimensions({ width: 1728, height: 1117 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current).toMatchObject({
        isTablet: true,
        isLandscape: true,
        isWideScreen: true,
        isUltraWide: true,
      });
    });
  });

  describe("layout decision logic (for SummaryCards)", () => {
    it("should use vertical layout on phones", () => {
      setMockDimensions({ width: 375, height: 667 });

      const { result } = renderHook(() => useResponsive());

      // Vertical: !isWideScreen || isUltraWide
      const shouldUseVertical = !result.current.isWideScreen || result.current.isUltraWide;
      expect(shouldUseVertical).toBe(true);
    });

    it("should use horizontal layout on wide screens (900-1599px)", () => {
      setMockDimensions({ width: 1200, height: 800 });

      const { result } = renderHook(() => useResponsive());

      // Horizontal: isWideScreen && !isUltraWide
      const shouldUseHorizontal = result.current.isWideScreen && !result.current.isUltraWide;
      expect(shouldUseHorizontal).toBe(true);
    });

    it("should use vertical layout on ultra-wide screens (>=1600px)", () => {
      setMockDimensions({ width: 2560, height: 1440 });

      const { result } = renderHook(() => useResponsive());

      // Vertical: !isWideScreen || isUltraWide
      const shouldUseVertical = !result.current.isWideScreen || result.current.isUltraWide;
      expect(shouldUseVertical).toBe(true);
    });

    it("should use horizontal at exactly 900px wide", () => {
      setMockDimensions({ width: 900, height: 600 });

      const { result } = renderHook(() => useResponsive());

      const shouldUseHorizontal = result.current.isWideScreen && !result.current.isUltraWide;
      expect(shouldUseHorizontal).toBe(true);
    });

    it("should use vertical at exactly 1600px wide", () => {
      setMockDimensions({ width: 1600, height: 900 });

      const { result } = renderHook(() => useResponsive());

      const shouldUseVertical = !result.current.isWideScreen || result.current.isUltraWide;
      expect(shouldUseVertical).toBe(true);
    });
  });
});

describe("getResponsiveValue", () => {
  it("should return phone value when not tablet", () => {
    const result = getResponsiveValue(false, "phoneValue", "tabletValue");
    expect(result).toBe("phoneValue");
  });

  it("should return tablet value when tablet", () => {
    const result = getResponsiveValue(true, "phoneValue", "tabletValue");
    expect(result).toBe("tabletValue");
  });

  it("should work with numbers", () => {
    expect(getResponsiveValue(false, 16, 24)).toBe(16);
    expect(getResponsiveValue(true, 16, 24)).toBe(24);
  });

  it("should work with objects", () => {
    const phoneStyle = { padding: 8 };
    const tabletStyle = { padding: 16 };

    expect(getResponsiveValue(false, phoneStyle, tabletStyle)).toBe(phoneStyle);
    expect(getResponsiveValue(true, phoneStyle, tabletStyle)).toBe(tabletStyle);
  });
});

describe("responsive constants", () => {
  it("should export correct breakpoints", () => {
    expect(responsive.breakpoints).toEqual({
      tablet: 768,
      largeTablet: 1024,
      wideScreen: 900,
      ultraWide: 1600,
    });
  });

  it("should export correct max widths", () => {
    expect(responsive.maxWidths).toEqual({
      content: 1200,
      modal: 600,
    });
  });
});
