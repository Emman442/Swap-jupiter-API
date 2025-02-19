import React from "react";

const PreviewBackground: React.FC<{ w: number; h: number }> = ({
  w,
  h,
}) => {
  return (
    <div className="space-y-2">
      <div className={`relative overflow-hidden bg-gray-700 rounded-lg w-${w} h-${h}`}>
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
          style={{
            transform: "translateX(-100%)",
            animation: "wave 2s infinite",
            backgroundSize: "200% 100%",
          }}
        />
      </div>
    </div>
  );
};

export default PreviewBackground;
