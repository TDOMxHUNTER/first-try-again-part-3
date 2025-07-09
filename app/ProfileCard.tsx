'use client';
import React, { useEffect, useRef, useCallback, useMemo } from "react";
import "./ProfileCard.css";
import html2canvas from 'html2canvas';

interface ProfileUpdateData {
  name?: string;
  title?: string;
  handle?: string;
  avatarUrl?: string;
  status?: string;
}

interface ProfileCardProps {
  avatarUrl: string;
  iconUrl?: string;
  grainUrl?: string;
  behindGradient?: string;
  innerGradient?: string;
  showBehindGradient?: boolean;
  className?: string;
  enableTilt?: boolean;
  miniAvatarUrl?: string;
  name?: string;
  title?: string;
  handle?: string;
  status?: string;
  contactText?: string;
  showUserInfo?: boolean;
  onContactClick?: () => void;
  onProfileUpdate?: (data: ProfileUpdateData) => void;
  onExportCard?: (format: 'png') => void;
  showSettings?: boolean;
  onToggleSettings?: () => void;
}

const DEFAULT_BEHIND_GRADIENT =
  "radial-gradient(farthest-side circle at var(--pointer-x) var(--pointer-y),hsla(266,100%,90%,var(--card-opacity)) 4%,hsla(266,50%,80%,calc(var(--card-opacity)*0.75)) 10%,hsla(266,25%,70%,calc(var(--card-opacity)*0.5)) 50%,hsla(266,0%,60%,0) 100%),radial-gradient(35% 52% at 55% 20%,#00ffaac4 0%,#073aff00 100%),radial-gradient(100% 100% at 50% 50%,#00c1ffff 1%,#073aff00 76%),conic-gradient(from 124deg at 50% 50%,#c137ffff 0%,#07c6ffff 40%,#07c6ffff 60%,#c137ffff 100%)";

const DEFAULT_INNER_GRADIENT =
  "linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)";

const ANIMATION_CONFIG = {
  SMOOTH_DURATION: 600,
  INITIAL_DURATION: 1500,
  INITIAL_X_OFFSET: 70,
  INITIAL_Y_OFFSET: 60,
} as const;

const clamp = (value: number, min = 0, max = 100): number =>
  Math.min(Math.max(value, min), max);

const round = (value: number, precision = 3): number =>
  parseFloat(value.toFixed(precision));

const adjust = (
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number
): number =>
  round(toMin + ((toMax - toMin) * (value - fromMin)) / (fromMax - fromMin));

const easeInOutCubic = (x: number): number =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

const DEFAULT_AVATAR_URL = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face";
const DEFAULT_ICON_URL = "/monad_logo.ico";

const ProfileCardComponent: React.FC<ProfileCardProps> = ({
  avatarUrl = DEFAULT_AVATAR_URL,
  iconUrl = DEFAULT_ICON_URL,
  grainUrl,
  behindGradient,
  innerGradient,
  showBehindGradient = true,
  className = "",
  enableTilt = true,
  miniAvatarUrl,
  name = "Javi A. Torres",
  title = "Software Engineer",
  handle = "javicodes",
  status = "Online",
  contactText = "Contact",
  showUserInfo = true,
  onContactClick,
  onProfileUpdate,
  onExportCard,
  showSettings = false,
  onToggleSettings,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = React.useState({
    name: name || "",
    title: title || "",
    handle: handle || "",
    status: status || "Online",
    avatarUrl: avatarUrl || ""
  });
  const [previewAvatar, setPreviewAvatar] = React.useState<string | null>(null);
  const profileData = React.useMemo(() => ({
    name,
    title,
    handle,
    status,
    avatarUrl,
  }), [name, title, handle, status, avatarUrl]);

  const animationHandlers = useMemo(() => {
    if (!enableTilt) return null;

    let rafId: number | null = null;

    const updateCardTransform = (
      offsetX: number,
      offsetY: number,
      card: HTMLElement,
      wrap: HTMLElement
    ) => {
      const width = card.clientWidth;
      const height = card.clientHeight;

      const percentX = clamp((100 / width) * offsetX);
      const percentY = clamp((100 / height) * offsetY);

      const centerX = percentX - 50;
      const centerY = percentY - 50;

      const properties = {
        "--pointer-x": `${percentX}%`,
        "--pointer-y": `${percentY}%`,
        "--background-x": `${adjust(percentX, 0, 100, 35, 65)}%`,
        "--background-y": `${adjust(percentY, 0, 100, 35, 65)}%`,
        "--pointer-from-center": `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
        "--pointer-from-top": `${percentY / 100}`,
        "--pointer-from-left": `${percentX / 100}`,
        "--rotate-x": `${round(-(centerX / 5))}deg`,
        "--rotate-y": `${round(centerY / 4)}deg`,
      };

      Object.entries(properties).forEach(([property, value]) => {
        wrap.style.setProperty(property, value);
      });
    };

    const createSmoothAnimation = (
      duration: number,
      startX: number,
      startY: number,
      card: HTMLElement,
      wrap: HTMLElement
    ) => {
      const startTime = performance.now();
      const targetX = wrap.clientWidth / 2;
      const targetY = wrap.clientHeight / 2;

      const animationLoop = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = clamp(elapsed / duration);
        const easedProgress = easeInOutCubic(progress);

        const currentX = adjust(easedProgress, 0, 1, startX, targetX);
        const currentY = adjust(easedProgress, 0, 1, startY, targetY);

        updateCardTransform(currentX, currentY, card, wrap);

        if (progress < 1) {
          rafId = requestAnimationFrame(animationLoop);
        }
      };

      rafId = requestAnimationFrame(animationLoop);
    };

    return {
      updateCardTransform,
      createSmoothAnimation,
      cancelAnimation: () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      },
    };
  }, [enableTilt]);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const card = cardRef.current;
      const wrap = wrapRef.current;

      if (!card || !wrap || !animationHandlers) return;

      const rect = card.getBoundingClientRect();
      animationHandlers.updateCardTransform(
        event.clientX - rect.left,
        event.clientY - rect.top,
        card,
        wrap
      );
    },
    [animationHandlers]
  );

  const handlePointerEnter = useCallback(() => {
    const card = cardRef.current;
    const wrap = wrapRef.current;

    if (!card || !wrap || !animationHandlers) return;

    animationHandlers.cancelAnimation();
    wrap.classList.add("active");
    card.classList.add("active");
  }, [animationHandlers]);

  const handlePointerLeave = useCallback(
    (event: PointerEvent) => {
      const card = cardRef.current;
      const wrap = wrapRef.current;

      if (!card || !wrap || !animationHandlers) return;

      animationHandlers.createSmoothAnimation(
        ANIMATION_CONFIG.SMOOTH_DURATION,
        event.offsetX,
        event.offsetY,
        card,
        wrap
      );
      wrap.classList.remove("active");
      card.classList.remove("active");
    },
    [animationHandlers]
  );

  useEffect(() => {
    if (!enableTilt || !animationHandlers) return;

    const card = cardRef.current;
    const wrap = wrapRef.current;

    if (!card || !wrap) return;

    const pointerMoveHandler = handlePointerMove as EventListener;
    const pointerEnterHandler = handlePointerEnter as EventListener;
    const pointerLeaveHandler = handlePointerLeave as EventListener;

    card.addEventListener("pointerenter", pointerEnterHandler);
    card.addEventListener("pointermove", pointerMoveHandler);
    card.addEventListener("pointerleave", pointerLeaveHandler);

    const initialX = wrap.clientWidth - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;

    animationHandlers.updateCardTransform(initialX, initialY, card, wrap);
    animationHandlers.createSmoothAnimation(
      ANIMATION_CONFIG.INITIAL_DURATION,
      initialX,
      initialY,
      card,
      wrap
    );

    return () => {
      card.removeEventListener("pointerenter", pointerEnterHandler);
      card.removeEventListener("pointermove", pointerMoveHandler);
      card.removeEventListener("pointerleave", pointerLeaveHandler);
      animationHandlers.cancelAnimation();
    };
  }, [
    enableTilt,
    animationHandlers,
    handlePointerMove,
    handlePointerEnter,
    handlePointerLeave,
  ]);

  const cardStyle = useMemo(
    () =>
      ({
        "--icon": iconUrl ? `url(${iconUrl})` : "none",
        "--grain": grainUrl ? `url(${grainUrl})` : "none",
        "--behind-gradient": showBehindGradient
          ? (behindGradient ?? DEFAULT_BEHIND_GRADIENT)
          : "none",
        "--inner-gradient": innerGradient ?? DEFAULT_INNER_GRADIENT,
      }) as React.CSSProperties,
    [iconUrl, grainUrl, showBehindGradient, behindGradient, innerGradient]
  );

  const handleContactClick = useCallback(() => {
    onContactClick?.();
  }, [onContactClick]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = () => {
    if (onProfileUpdate && showSettings) {
      const updateData = { 
        name: formData.name,
        title: formData.title,
        handle: formData.handle,
        status: formData.status,
        avatarUrl: previewAvatar || formData.avatarUrl
      };
      onProfileUpdate(updateData);
    }
    setPreviewAvatar(null);
    onToggleSettings?.();
  };

  React.useEffect(() => {
    if (showSettings) {
      setFormData({
        name: name || "",
        title: title || "",
        handle: handle || "",
        status: status || "Online",
        avatarUrl: avatarUrl || ""
      });
    } else {
      setPreviewAvatar(null);
    }
  }, [showSettings, name, title, handle, status, avatarUrl]);

  const handleExportCard = async (format: 'png' | 'jpeg') => {
    // Target only the card element, not the wrapper with buttons
    const cardElement = document.querySelector('.pc-card') as HTMLElement;
    if (!cardElement) return;

    try {
      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: cardElement.offsetWidth,
        height: cardElement.offsetHeight,
        ignoreElements: (element) => {
          // Ignore all button and UI elements that shouldn't be in the export
          return element.classList.contains('pc-export-btn') || 
                 element.classList.contains('pc-settings-btn') || 
                 element.classList.contains('pc-settings-panel') ||
                 element.closest('.pc-export-btn') !== null ||
                 element.closest('.pc-settings-btn') !== null ||
                 element.closest('.pc-settings-panel') !== null;
        }
      });

      const link = document.createElement('a');
      link.download = `monad-profile-card-${profileData.handle}.${format}`;
      link.href = canvas.toDataURL(`image/${format === 'jpeg' ? 'jpeg' : 'png'}`);
      link.click();
    } catch (error) {
      console.error('Error exporting card:', error);
    }
  };

  return (
    <div className="pc-container">
      <div
        ref={wrapRef}
        className={`pc-card-wrapper ${className}`.trim()}
        style={cardStyle}
      >
        <section ref={cardRef} className="pc-card">
          <div className="pc-inside">
            <div className="pc-shine" />
            <div className="pc-glare" />
            <div className="pc-content pc-avatar-content">
              <img
                className="avatar"
                src={showSettings && previewAvatar ? previewAvatar : avatarUrl}
                alt={`${name || "User"} avatar`}
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = DEFAULT_AVATAR_URL;
                }}
              />
              {showUserInfo && (
                <div className="pc-user-info">
                  <div className="pc-user-details">
                    <div className="pc-mini-avatar">
                      <img
                        src={showSettings && previewAvatar ? previewAvatar : (miniAvatarUrl || avatarUrl)}
                        alt={`${name || "User"} mini avatar`}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = DEFAULT_AVATAR_URL;
                        }}
                      />
                    </div>
                    <div className="pc-user-text">
                      <div 
                        className="pc-handle clickable"
                        onClick={() => window.open(`https://x.com/${showSettings ? formData.handle : handle}`, '_blank')}
                        style={{ cursor: 'pointer' }}
                      >
                        @{showSettings ? formData.handle : handle}
                      </div>
                      <div className="pc-status">
                        {showSettings ? formData.status : status}
                      </div>
                    </div>
                  </div>
                  <button
                    className="pc-contact-btn"
                    onClick={handleContactClick}
                    style={{ pointerEvents: "auto" }}
                    type="button"
                    aria-label={`Contact ${name || "user"} on X`}
                  >
                    <span className="pc-contact-icon">𝕏</span>
                    {contactText}
                  </button>
                </div>
              )}
            </div>
            <div className="pc-content">
              <div className="pc-details">
                <h3>{showSettings ? formData.name : name}</h3>
                <p>{showSettings ? formData.title : title}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Export and Settings Buttons */}
        <button
          className="pc-export-btn"
          onClick={() => onExportCard?.('png')}
          style={{ pointerEvents: "auto" }}
          type="button"
          aria-label="Export as PNG"
          title="Save as PNG"
        >
          📥
        </button>
        <button
          className="pc-settings-btn"
          onClick={onToggleSettings}
          style={{ pointerEvents: "auto" }}
          type="button"
          aria-label="Settings"
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="pc-settings-panel">
          <div className="pc-settings-header">
            <h3>Customize Profile</h3>
            <button 
              className="pc-close-btn"
              onClick={onToggleSettings}
              type="button"
              aria-label="Close settings"
            >
              ✕
            </button>
          </div>

          <div className="pc-settings-form">
            <div className="pc-form-group">
              <label htmlFor="name">Name:</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div className="pc-form-group">
              <label htmlFor="title">Title:</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter your title"
              />
            </div>

            <div className="pc-form-group">
              <label htmlFor="handle">X Handle:</label>
              <input
                id="handle"
                type="text"
                value={formData.handle}
                onChange={(e) => handleInputChange('handle', e.target.value)}
                placeholder="Enter X handle (without @)"
              />
            </div>

            <div className="pc-form-group">
              <label htmlFor="status">Status:</label>
              <input
                id="status"
                type="text"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                placeholder="Enter your status (e.g., Online, Coding, Away...)"
              />
            </div>

            <div className="pc-form-group">
              <label htmlFor="avatar-upload">Upload Avatar:</label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      // Advanced background removal using canvas
                      const canvas = document.createElement('canvas');
                      const ctx = canvas.getContext('2d');
                      const img = new Image();

                      img.onload = () => {
                        canvas.width = img.width;
                        canvas.height = img.height;

                        // Draw the image
                        ctx?.drawImage(img, 0, 0);

                        // Get image data
                        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
                        if (imageData) {
                          const data = imageData.data;

                          // Advanced background removal algorithm
                          for (let i = 0; i < data.length; i += 4) {
                            const r = data[i];
                            const g = data[i + 1];
                            const b = data[i + 2];
                            const a = data[i + 3];

                            // Calculate color metrics
                            const brightness = (r + g + b) / 3;
                            const saturation = Math.abs(Math.max(r, g, b) - Math.min(r, g, b));
                            const variance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);

                            // Edge detection - check surrounding pixels for major differences
                            const x = (i / 4) % canvas.width;
                            const y = Math.floor((i / 4) / canvas.width);

                            let isEdge = false;
                            if (x > 0 && x < canvas.width - 1 && y > 0 && y < canvas.height - 1) {
                              const neighbors = [
                                data[i - 4], data[i + 4], // left, right
                                data[i - canvas.width * 4], data[i + canvas.width * 4] // top, bottom
                              ];
                              const avgNeighbor = neighbors.reduce((sum, val) => sum + val, 0) / neighbors.length;
                              isEdge = Math.abs(brightness - avgNeighbor) > 30;
                            }

                            // Comprehensive background removal conditions
                            const shouldRemove = 
                              // Very bright/white backgrounds
                              brightness > 240 ||
                              // Light gray/beige backgrounds
                              (brightness > 200 && saturation < 20) ||
                              // Very uniform colors (low variance)
                              (variance < 15 && brightness > 180) ||
                              // Common background colors
                              (r > 245 && g > 245 && b > 240) || // Off-white
                              (r > 235 && g > 235 && b > 220 && saturation < 25) || // Light beige/cream
                              (r > 220 && g > 220 && b > 220 && saturation < 15) || // Light gray
                              // Green screen detection
                              (g > 200 && r < 100 && b < 100) ||
                              // Blue screen detection
                              (b > 200 && r < 100 && g < 100) ||
                              // Studio backdrop grays
                              (brightness > 160 && brightness < 200 && saturation < 10) ||
                              // Very light pastels
                              (brightness > 210 && saturation < 30);

                            // Keep edge pixels to maintain subject outline
                            if (shouldRemove && !isEdge) {
                              data[i + 3] = 0; // Make transparent
                            }
                            // Soften edges slightly for better blending
                            else if (isEdge && shouldRemove) {
                              data[i + 3] = Math.min(255, a * 0.7);
                            }
                          }

                          // Second pass: Remove isolated pixels and smooth edges
                          const processedData = new Uint8ClampedArray(data);
                          for (let i = 0; i < data.length; i += 4) {
                            const x = (i / 4) % canvas.width;
                            const y = Math.floor((i / 4) / canvas.width);

                            if (data[i + 3] > 0 && x > 1 && x < canvas.width - 2 && y > 1 && y < canvas.height - 2) {
                              // Count transparent neighbors
                              let transparentCount = 0;
                              for (let dx = -2; dx <= 2; dx++) {
                                for (let dy = -2; dy <= 2; dy++) {
                                  const neighborIndex = ((y + dy) * canvas.width + (x + dx)) * 4;
                                  if (data[neighborIndex + 3] === 0) transparentCount++;
                                }
                              }

                              // If mostly surrounded by transparency, reduce opacity
                              if (transparentCount > 15) {
                                processedData[i + 3] = Math.min(data[i + 3], 100);
                              }
                            }
                          }

                          // Put the processed image data back
                          ctx?.putImageData(new ImageData(processedData, canvas.width, canvas.height), 0, 0);
                        }

                        // Convert to data URL with PNG format to preserve transparency
                        const result = canvas.toDataURL('image/png', 1.0);
                        setPreviewAvatar(result);
                      };

                      // Read file as data URL
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        img.src = e.target?.result as string;
                      };
                      reader.readAsDataURL(file);
                    } catch (error) {
                      console.error('Error processing image:', error);
                      // Fallback to original image if processing fails
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        const result = e.target?.result as string;
                        setPreviewAvatar(result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }
                }}
                className="pc-file-input"
              />
            </div>

            <div className="pc-settings-actions">
              <button
                className="pc-save-btn"
                onClick={handleSaveChanges}
                type="button"
              >
                Save Changes
              </button>
              <button
                className="pc-cancel-btn"
                onClick={onToggleSettings}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileCard = React.memo(ProfileCardComponent);

export default ProfileCard;