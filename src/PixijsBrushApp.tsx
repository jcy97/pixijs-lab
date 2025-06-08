import React, { useRef, useEffect, useState } from "react";
import * as PIXI from "pixi.js";

interface BrushSettings {
  color: string;
  size: number;
}

const PixijsBrushApp: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const containerRef = useRef<PIXI.Container | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentStrokeRef = useRef<PIXI.Graphics | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [brushSettings, setBrushSettings] = useState<BrushSettings>({
    color: "#000000",
    size: 5,
  });

  const brushSettingsRef = useRef<BrushSettings>(brushSettings);

  // brushSettings가 변경될 때마다 ref 업데이트
  useEffect(() => {
    brushSettingsRef.current = brushSettings;
  }, [brushSettings]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // PixiJS 앱 초기화
    const app = new PIXI.Application();

    app
      .init({
        width: 800,
        height: 600,
        backgroundColor: 0xffffff,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })
      .then(() => {
        if (!canvasRef.current) return;

        appRef.current = app;
        canvasRef.current.appendChild(app.canvas);

        // 컨테이너 생성 (모든 그림을 담을 컨테이너)
        const container = new PIXI.Container();
        containerRef.current = container;
        app.stage.addChild(container);

        // 마우스 이벤트 설정
        const canvas = app.canvas;
        canvas.style.cursor = "crosshair";
        canvas.style.width = "800px";
        canvas.style.height = "600px";

        // 정확한 좌표 변환 함수
        const getCanvasCoordinates = (clientX: number, clientY: number) => {
          const rect = canvas.getBoundingClientRect();
          // CSS 크기와 실제 캔버스 크기의 비율 계산
          const scaleX = 800 / rect.width; // 논리적 크기 기준
          const scaleY = 600 / rect.height;

          return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
          };
        };

        // 마우스 다운 이벤트
        const handleMouseDown = (event: MouseEvent) => {
          isDrawingRef.current = true;
          const coords = getCanvasCoordinates(event.clientX, event.clientY);

          lastPointRef.current = coords;

          // 새로운 Graphics 객체로 새 스트로크 시작
          const stroke = new PIXI.Graphics();
          currentStrokeRef.current = stroke;
          container.addChild(stroke);

          // 현재 브러쉬 설정 사용
          const currentSettings = brushSettingsRef.current;

          // 시작점에 원 그리기
          stroke.circle(coords.x, coords.y, currentSettings.size / 2);
          stroke.fill(parseInt(currentSettings.color.replace("#", ""), 16));
        };

        // 마우스 이동 이벤트
        const handleMouseMove = (event: MouseEvent) => {
          if (
            !isDrawingRef.current ||
            !lastPointRef.current ||
            !currentStrokeRef.current
          )
            return;

          const coords = getCanvasCoordinates(event.clientX, event.clientY);
          const stroke = currentStrokeRef.current;
          const currentSettings = brushSettingsRef.current;
          const color = parseInt(currentSettings.color.replace("#", ""), 16);

          // 이전 점과 현재 점 사이에 선 그리기 (PixiJS 8 방식)
          stroke.moveTo(lastPointRef.current.x, lastPointRef.current.y);
          stroke.lineTo(coords.x, coords.y);
          stroke.stroke({
            width: currentSettings.size,
            color: color,
            cap: "round",
            join: "round",
          });

          // 현재 점에도 원 그리기 (더 부드러운 효과)
          stroke.circle(coords.x, coords.y, currentSettings.size / 2);
          stroke.fill(color);

          lastPointRef.current = coords;
        };

        // 마우스 업 이벤트
        const handleMouseUp = () => {
          isDrawingRef.current = false;
          lastPointRef.current = null;
          currentStrokeRef.current = null;
        };

        // 마우스가 캔버스를 벗어날 때
        const handleMouseLeave = () => {
          isDrawingRef.current = false;
          lastPointRef.current = null;
          currentStrokeRef.current = null;
        };

        // 이벤트 리스너 등록
        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseup", handleMouseUp);
        canvas.addEventListener("mouseleave", handleMouseLeave);

        // 컴포넌트 언마운트 시 정리
        return () => {
          canvas.removeEventListener("mousedown", handleMouseDown);
          canvas.removeEventListener("mousemove", handleMouseMove);
          canvas.removeEventListener("mouseup", handleMouseUp);
          canvas.removeEventListener("mouseleave", handleMouseLeave);

          if (canvasRef.current && app.canvas) {
            canvasRef.current.removeChild(app.canvas);
          }
          app.destroy();
        };
      })
      .catch((error) => {
        console.error("PixiJS 초기화 실패:", error);
      });
  }, []); // brushSettings 의존성 제거

  // 캔버스 클리어 함수
  const clearCanvas = () => {
    if (containerRef.current) {
      containerRef.current.removeChildren();
    }
  };

  // 색상 변경 핸들러
  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBrushSettings((prev) => ({
      ...prev,
      color: event.target.value,
    }));
  };

  // 브러쉬 크기 변경 핸들러
  const handleSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBrushSettings((prev) => ({
      ...prev,
      size: parseInt(event.target.value),
    }));
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        PixiJS 8 브러쉬 예제
      </h1>

      {/* 컨트롤 패널 */}
      <div className="flex gap-4 mb-4 p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center gap-2">
          <label htmlFor="color" className="text-sm font-medium text-gray-700">
            색상:
          </label>
          <input
            id="color"
            type="color"
            value={brushSettings.color}
            onChange={handleColorChange}
            className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="size" className="text-sm font-medium text-gray-700">
            크기:
          </label>
          <input
            id="size"
            type="range"
            min="1"
            max="50"
            value={brushSettings.size}
            onChange={handleSizeChange}
            className="w-24"
          />
          <span className="text-sm text-gray-600 w-8">
            {brushSettings.size}
          </span>
        </div>

        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          지우기
        </button>
      </div>

      {/* 캔버스 컨테이너 */}
      <div
        ref={canvasRef}
        className="border-4 border-gray-300 rounded-lg shadow-lg bg-white"
        style={{ width: "800px", height: "600px" }}
      />

      <p className="mt-4 text-gray-600 text-center max-w-md">
        마우스를 드래그하여 그림을 그려보세요. PixiJS 8 버전에 최적화되었습니다.
      </p>
    </div>
  );
};

export default PixijsBrushApp;
