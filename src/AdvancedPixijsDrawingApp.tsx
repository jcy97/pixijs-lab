import React, { useRef, useEffect, useState, useCallback } from "react";
import * as PIXI from "pixi.js";

// 레이어 타입 정의 (간소화)
interface Layer {
  id: string;
  name: string;
  container: PIXI.Container;
  graphics: PIXI.Graphics;
  visible: boolean;
  opacity: number;
}

// 브러쉬 설정 타입
interface BrushSettings {
  color: string;
  size: number;
  hardness: number;
  opacity: number;
  spacing: number;
}

const AdvancedPixijsDrawingApp: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string>("");
  const [brushSettings, setBrushSettings] = useState<BrushSettings>({
    color: "#000000",
    size: 20,
    hardness: 0.8,
    opacity: 1,
    spacing: 0.05,
  });

  const brushSettingsRef = useRef<BrushSettings>(brushSettings);
  const activeLayerRef = useRef<Layer | null>(null);
  const brushTextureRef = useRef<PIXI.RenderTexture | null>(null);
  const brushSpriteRef = useRef<PIXI.Sprite | null>(null);

  // 브러쉬 설정 업데이트
  useEffect(() => {
    brushSettingsRef.current = brushSettings;
    // 브러쉬 설정이 바뀔 때마다 브러쉬 텍스처 재생성
    createBrushTexture();
  }, [brushSettings]);

  // 활성 레이어 업데이트
  useEffect(() => {
    activeLayerRef.current = layers.find((l) => l.id === activeLayerId) || null;
  }, [activeLayerId, layers]);

  // 브러쉬 텍스처 미리 생성 (한 번만 만들고 재사용)
  const createBrushTexture = useCallback(() => {
    console.log("텍스쳐 업데이트");
    if (!appRef.current) return;

    const settings = brushSettingsRef.current;
    const size = settings.size;
    const radius = size / 2;
    const color = parseInt(settings.color.replace("#", ""), 16);

    // 기존 텍스처 정리
    if (brushTextureRef.current) {
      brushTextureRef.current.destroy();
    }
    if (brushSpriteRef.current) {
      brushSpriteRef.current.destroy();
    }

    // 브러쉬 Graphics 생성
    const brushGraphics = new PIXI.Graphics();
    brushGraphics.beginFill(color, settings.opacity);
    brushGraphics.drawCircle(radius, radius, radius);
    brushGraphics.endFill();

    // 부드러움 적용
    if (settings.hardness < 0.98) {
      const blurAmount = (1 - settings.hardness) * radius * 0.6;
      const blurFilter = new PIXI.BlurFilter();
      blurFilter.blur = blurAmount;
      blurFilter.quality = 3; // 성능을 위해 품질 조정
      brushGraphics.filters = [blurFilter];
    }

    // RenderTexture에 브러쉬 렌더링
    const padding = Math.max(20, radius);
    const textureSize = size + padding * 2;
    brushTextureRef.current = PIXI.RenderTexture.create({
      width: textureSize,
      height: textureSize,
    });

    brushGraphics.x = padding;
    brushGraphics.y = padding;

    appRef.current.renderer.render(brushGraphics, {
      renderTexture: brushTextureRef.current,
    });

    // 재사용할 Sprite 생성
    brushSpriteRef.current = new PIXI.Sprite(brushTextureRef.current);
    brushSpriteRef.current.anchor.set(0.5, 0.5); // 중심점 설정

    // 임시 Graphics 정리
    brushGraphics.destroy();
  }, []);

  // 빠른 브러쉬 스트로크 그리기 (미리 만든 텍스처 재사용)
  const drawBrushStroke = useCallback((x: number, y: number) => {
    const activeLayer = activeLayerRef.current;
    if (!activeLayer || !brushSpriteRef.current || !brushTextureRef.current) {
      console.log("브러쉬 준비되지 않음");
      return;
    }

    // 새로운 Sprite 생성 (미리 만든 텍스처 재사용)
    const stamp = new PIXI.Sprite(brushTextureRef.current);
    stamp.anchor.set(0.5, 0.5);
    stamp.x = x;
    stamp.y = y;

    // 감마 보정된 알파 적용 (포토샵과 유사)
    const userOpacity = brushSettingsRef.current.opacity; // 0~1
    const gamma = 2.2;

    const minVisible = 0.07; // 7% 이하도 살짝 보이게
    const corrected =
      minVisible + (1 - minVisible) * Math.pow(userOpacity, gamma);
    stamp.alpha = corrected;

    // 레이어에 추가
    activeLayer.container.addChild(stamp);
  }, []);

  // 선 보간 그리기
  const drawInterpolatedLine = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      const settings = brushSettingsRef.current;
      const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

      const effectiveSpacing = Math.min(settings.spacing, 0.5);
      const spacing = Math.max(1, settings.size * effectiveSpacing);
      const steps = Math.max(1, Math.ceil(distance / spacing));

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t;
        drawBrushStroke(x, y);
      }
    },
    [drawBrushStroke]
  );

  // PixiJS 초기화
  useEffect(() => {
    if (!canvasRef.current) return;

    const initApp = async () => {
      try {
        console.log("PixiJS 초기화 시작");

        const app = new PIXI.Application();
        await app.init({
          width: 800,
          height: 600,
          backgroundColor: 0xffffff,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });

        if (!canvasRef.current) return;

        appRef.current = app;
        canvasRef.current.appendChild(app.canvas);

        // 캔버스 스타일 설정
        const canvas = app.canvas;
        canvas.style.cursor = "crosshair";
        canvas.style.display = "block";
        canvas.style.width = "100%";
        canvas.style.height = "100%";

        // 초기 레이어 생성
        const initialGraphics = new PIXI.Graphics();
        const initialContainer = new PIXI.Container();
        initialContainer.addChild(initialGraphics);
        app.stage.addChild(initialContainer);

        const initialLayer: Layer = {
          id: "layer-1",
          name: "레이어 1",
          container: initialContainer,
          graphics: initialGraphics,
          visible: true,
          opacity: 1,
        };

        setLayers([initialLayer]);
        setActiveLayerId(initialLayer.id);

        console.log("초기 레이어 생성 완료");

        // 초기 브러쉬 텍스처 생성
        setTimeout(() => {
          createBrushTexture();
        }, 100);

        // 좌표 변환 함수
        const getCanvasCoordinates = (clientX: number, clientY: number) => {
          const rect = canvas.getBoundingClientRect();
          const scaleX = 800 / rect.width;
          const scaleY = 600 / rect.height;

          return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
          };
        };

        // 마우스 이벤트 핸들러
        const handleMouseDown = (event: MouseEvent) => {
          event.preventDefault();
          console.log("마우스 다운!");

          isDrawingRef.current = true;
          const coords = getCanvasCoordinates(event.clientX, event.clientY);
          lastPointRef.current = coords;

          console.log("그리기 시작:", coords);
          drawBrushStroke(coords.x, coords.y);
        };

        const handleMouseMove = (event: MouseEvent) => {
          if (!isDrawingRef.current || !lastPointRef.current) return;

          event.preventDefault();
          const coords = getCanvasCoordinates(event.clientX, event.clientY);

          console.log("그리기 중:", coords);

          drawInterpolatedLine(
            lastPointRef.current.x,
            lastPointRef.current.y,
            coords.x,
            coords.y
          );

          lastPointRef.current = coords;
        };

        const handleMouseUp = (event: MouseEvent) => {
          event.preventDefault();
          console.log("마우스 업!");
          isDrawingRef.current = false;
          lastPointRef.current = null;
        };

        const handleMouseLeave = () => {
          console.log("마우스 캔버스 벗어남");
          isDrawingRef.current = false;
          lastPointRef.current = null;
        };

        // 이벤트 리스너 등록
        canvas.addEventListener("mousedown", handleMouseDown, {
          passive: false,
        });
        canvas.addEventListener("mousemove", handleMouseMove, {
          passive: false,
        });
        canvas.addEventListener("mouseup", handleMouseUp, { passive: false });
        canvas.addEventListener("mouseleave", handleMouseLeave, {
          passive: false,
        });

        console.log("이벤트 리스너 등록 완료");

        // 정리 함수
        return () => {
          console.log("정리 시작");
          canvas.removeEventListener("mousedown", handleMouseDown);
          canvas.removeEventListener("mousemove", handleMouseMove);
          canvas.removeEventListener("mouseup", handleMouseUp);
          canvas.removeEventListener("mouseleave", handleMouseLeave);

          if (
            canvasRef.current &&
            app.canvas &&
            canvasRef.current.contains(app.canvas)
          ) {
            canvasRef.current.removeChild(app.canvas);
          }
          app.destroy();
        };
      } catch (error) {
        console.error("PixiJS 초기화 실패:", error);
      }
    };

    const cleanup = initApp();
    return () => {
      cleanup.then((cleanupFn) => cleanupFn && cleanupFn());
    };
  }, [drawBrushStroke, drawInterpolatedLine, createBrushTexture]);

  // 새 레이어 추가
  const addLayer = () => {
    if (!appRef.current) return;

    const newGraphics = new PIXI.Graphics();
    const newContainer = new PIXI.Container();
    newContainer.addChild(newGraphics);
    appRef.current.stage.addChild(newContainer);

    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `레이어 ${layers.length + 1}`,
      container: newContainer,
      graphics: newGraphics,
      visible: true,
      opacity: 1,
    };

    setLayers([...layers, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  // 레이어 삭제
  const deleteLayer = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer || layers.length === 1) return;

    if (appRef.current) {
      appRef.current.stage.removeChild(layer.container);
    }
    layer.container.destroy();

    const newLayers = layers.filter((l) => l.id !== layerId);
    setLayers(newLayers);

    if (activeLayerId === layerId && newLayers.length > 0) {
      setActiveLayerId(newLayers[newLayers.length - 1].id);
    }
  };

  // 레이어 투명도 변경
  const changeLayerOpacity = (layerId: string, opacity: number) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    layer.opacity = opacity;
    layer.container.alpha = opacity;
    setLayers([...layers]);
  };

  // 레이어 표시/숨김 토글
  const toggleLayerVisibility = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    layer.visible = !layer.visible;
    layer.container.visible = layer.visible;
    setLayers([...layers]);
  };

  // 전체 캔버스 클리어
  const clearCanvas = () => {
    layers.forEach((layer) => {
      layer.graphics.clear();
    });
  };

  // 현재 레이어만 클리어
  const clearCurrentLayer = () => {
    const activeLayer = layers.find((l) => l.id === activeLayerId);
    if (!activeLayer) return;

    activeLayer.graphics.clear();
  };

  return (
    <div className="w-full h-screen flex overflow-hidden bg-gray-50">
      {/* 왼쪽 사이드바 */}
      <div className="w-[30%] bg-white shadow-xl overflow-y-auto border-r border-gray-200">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">브러쉬 설정</h2>

          {/* 색상 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              색상
            </label>
            <input
              type="color"
              value={brushSettings.color}
              onChange={(e) =>
                setBrushSettings((prev) => ({ ...prev, color: e.target.value }))
              }
              className="w-full h-12 cursor-pointer rounded border border-gray-300"
            />
          </div>

          {/* 브러쉬 미리보기 */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              브러쉬 미리보기
            </label>
            <div className="w-full h-20 bg-gray-100 rounded border flex items-center justify-center">
              <div
                className="rounded-full transition-all duration-200"
                style={{
                  width: `${Math.min(brushSettings.size, 60)}px`,
                  height: `${Math.min(brushSettings.size, 60)}px`,
                  backgroundColor: brushSettings.color,
                  opacity: brushSettings.opacity,
                  filter:
                    brushSettings.hardness < 0.99
                      ? `blur(${(1 - brushSettings.hardness) * 3}px)`
                      : "none",
                  boxShadow:
                    brushSettings.hardness < 0.99
                      ? `0 0 ${(1 - brushSettings.hardness) * 10}px ${
                          brushSettings.color
                        }`
                      : "none",
                }}
              />
            </div>
          </div>

          {/* 브러쉬 크기 */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              크기: {brushSettings.size}px
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={brushSettings.size}
              onChange={(e) =>
                setBrushSettings((prev) => ({
                  ...prev,
                  size: parseInt(e.target.value),
                }))
              }
              className="w-full"
            />
          </div>

          {/* 브러쉬 부드러움 */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              부드러움: {Math.round(brushSettings.hardness * 100)}%
              <span className="text-xs text-gray-500 ml-2">
                (0% = 매우 부드러움, 100% = 딱딱함)
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={brushSettings.hardness * 100}
              onChange={(e) =>
                setBrushSettings((prev) => ({
                  ...prev,
                  hardness: parseInt(e.target.value) / 100,
                }))
              }
              className="w-full"
            />
          </div>

          {/* 브러쉬 투명도 */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              불투명도: {Math.round(brushSettings.opacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={brushSettings.opacity * 100}
              onChange={(e) =>
                setBrushSettings((prev) => ({
                  ...prev,
                  opacity: parseInt(e.target.value) / 100,
                }))
              }
              className="w-full"
            />
          </div>

          {/* 액션 버튼 */}
          <div className="mb-8 space-y-2">
            <button
              onClick={clearCurrentLayer}
              className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              현재 레이어 지우기
            </button>
            <button
              onClick={clearCanvas}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              전체 지우기
            </button>
          </div>

          {/* 레이어 패널 */}
          <h2 className="text-2xl font-bold mb-4 text-gray-800">레이어</h2>
          <button
            onClick={addLayer}
            className="w-full mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            새 레이어 추가
          </button>

          <div className="space-y-2">
            {[...layers].reverse().map((layer, index) => (
              <div
                key={layer.id}
                className={`p-3 border rounded-lg transition-all ${
                  activeLayerId === layer.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => setActiveLayerId(layer.id)}
                    className="font-medium text-left flex-grow text-gray-800"
                  >
                    {layer.name}
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleLayerVisibility(layer.id)}
                      className="p-1 text-xs bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                    >
                      {layer.visible ? "👁️" : "🚫"}
                    </button>
                    <button
                      onClick={() => deleteLayer(layer.id)}
                      className="p-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      disabled={layers.length === 1}
                    >
                      삭제
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">투명도:</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={layer.opacity * 100}
                    onChange={(e) =>
                      changeLayerOpacity(
                        layer.id,
                        parseInt(e.target.value) / 100
                      )
                    }
                    className="flex-grow h-4"
                  />
                  <span className="text-xs w-10 text-gray-600">
                    {Math.round(layer.opacity * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 오른쪽 캔버스 영역 */}
      <div className="w-[70%] flex flex-col items-center justify-center p-8 bg-gray-100">
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-full">
          <div
            ref={canvasRef}
            className="border-4 border-gray-300 rounded-lg"
            style={{
              width: "800px",
              height: "600px",
              backgroundColor: "#f8f8f8",
            }}
          />
          <div className="mt-4 text-center">
            <p className="text-gray-700 font-medium">
              마우스를 드래그하여 그림을 그려보세요
            </p>
            <p className="text-sm mt-1 text-gray-500">
              현재 레이어:{" "}
              <span className="font-medium text-gray-700">
                {layers.find((l) => l.id === activeLayerId)?.name || "없음"}
              </span>
            </p>
            <p className="text-xs mt-1 text-gray-400">
              브러쉬: {brushSettings.size}px, 부드러움:{" "}
              {Math.round(brushSettings.hardness * 100)}%, 불투명도:{" "}
              {Math.round(brushSettings.opacity * 100)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedPixijsDrawingApp;
