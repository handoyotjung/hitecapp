import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Arrow, Rect } from 'react-konva';
import useImage from 'use-image';
import { Edit2, MoveUpRight, Square, Trash2, Download, Check } from 'lucide-react';

function CanvasBackgroundImage({ src, stageWidth, stageHeight }) {
  const [image] = useImage(src, 'Anonymous');
  if (!image || !image.width || !image.height || !stageWidth || !stageHeight) return null;

  const imgRatio = image.width / image.height;
  const stageRatio = stageWidth / stageHeight;
  if (!isFinite(imgRatio) || isNaN(imgRatio) || !isFinite(stageRatio) || isNaN(stageRatio)) return null;

  let drawW = stageWidth;
  let drawH = stageHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (imgRatio > stageRatio) {
    drawW = stageWidth;
    drawH = stageWidth / imgRatio;
    offsetY = (stageHeight - drawH) / 2;
  } else {
    drawH = stageHeight;
    drawW = stageHeight * imgRatio;
    offsetX = (stageWidth - drawW) / 2;
  }

  return (
    <KonvaImage
      image={image}
      x={offsetX}
      y={offsetY}
      width={drawW}
      height={drawH}
    />
  );
}

export default function AnnotatedImageCanvas({
  photo,
  onSaveAnnotatedImage,
  stageWidth = 800,
  stageHeight = 240,
  photoCounter = ''
}) {
  const [tool, setTool] = useState('select'); // 'doodle', 'arrow', 'rect', 'select'
  const [lines, setLines] = useState([]);
  const [arrows, setArrows] = useState([]);
  const [rects, setRects] = useState([]);
  const [color, setColor] = useState('#FF0000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isDrawing = useRef(false);
  const stageRef = useRef();

  const photoKey = photo?.id || photo?.filename;

  // Load annotations from current photo when switching photos
  useEffect(() => {
    if (photo && photo.annotations) {
      setLines(photo.annotations.lines || []);
      setArrows(photo.annotations.arrows || []);
      setRects(photo.annotations.rects || []);
    } else {
      setLines([]);
      setArrows([]);
      setRects([]);
    }
  }, [photoKey]);

  const getPointerPos = (e) => {
    const stage = e.target.getStage();
    return stage.getPointerPosition();
  };

  // 1. HANDLE MOUSE / TOUCH DOWN
  const handleMouseDown = (e) => {
    if (tool === 'select') return;
    const pos = getPointerPos(e);
    if (!pos) return;

    isDrawing.current = true;

    if (tool === 'doodle') {
      setLines([...lines, { points: [pos.x, pos.y], color, strokeWidth }]);
    } else if (tool === 'arrow') {
      setArrows([...arrows, { points: [pos.x, pos.y, pos.x, pos.y], color, strokeWidth }]);
    } else if (tool === 'rect') {
      setRects([...rects, { x: pos.x, y: pos.y, width: 0, height: 0, color, strokeWidth }]);
    }
  };

  // 2. HANDLE MOUSE / TOUCH MOVE
  const handleMouseMove = (e) => {
    if (!isDrawing.current || tool === 'select') return;
    const pos = getPointerPos(e);
    if (!pos) return;

    if (tool === 'doodle') {
      let lastLine = { ...lines[lines.length - 1] };
      lastLine.points = lastLine.points.concat([pos.x, pos.y]);
      setLines([...lines.slice(0, -1), lastLine]);
    } else if (tool === 'arrow') {
      let lastArrow = { ...arrows[arrows.length - 1] };
      lastArrow.points = [lastArrow.points[0], lastArrow.points[1], pos.x, pos.y];
      setArrows([...arrows.slice(0, -1), lastArrow]);
    } else if (tool === 'rect') {
      let lastRect = { ...rects[rects.length - 1] };
      lastRect.width = pos.x - lastRect.x;
      lastRect.height = pos.y - lastRect.y;
      setRects([...rects.slice(0, -1), lastRect]);
    }
  };

  // 3. HANDLE MOUSE / TOUCH UP
  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  // 4. CLEAR BUTTON
  const handleClear = () => {
    setLines([]);
    setArrows([]);
    setRects([]);
  };

  // 5. SAVE IMAGE BUTTON
  const handleSaveImage = () => {
    if (!stageRef.current || !photo) return;
    const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
    const annotationsObj = { lines, arrows, rects };

    if (onSaveAnnotatedImage) {
      onSaveAnnotatedImage(photo, dataURL, annotationsObj);
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const imageSrc = photo?.annotatedBase64 || photo?.base64 || photo?.url || photo?.thumbnailUrl;

  return (
    <div className="flex flex-col w-full justify-start">
      {/* TOOLBAR BAR (Same row as filename on left, annotation tools centered, Save Image on right) */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 shrink-0">
        {/* Left: Filename */}
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider truncate max-w-[150px] md:max-w-[200px]">
          {photo?.filename || "Preview"}
        </div>

        {/* Center: Tools + Color + Width */}
        <div className="flex flex-wrap items-center gap-1.5 justify-center">
          {/* Doodle */}
          <button
            type="button"
            onClick={() => setTool(tool === 'doodle' ? 'select' : 'doodle')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
              tool === 'doodle'
                ? 'bg-[#1E3A8A] border-blue-500 text-white shadow-sm'
                : 'bg-[#374151] border-slate-600 text-slate-300 hover:text-white'
            }`}
            title="Doodle (Free Draw)"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Doodle</span>
          </button>

          {/* Arrow */}
          <button
            type="button"
            onClick={() => setTool(tool === 'arrow' ? 'select' : 'arrow')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
              tool === 'arrow'
                ? 'bg-[#1E3A8A] border-blue-500 text-white shadow-sm'
                : 'bg-[#374151] border-slate-600 text-slate-300 hover:text-white'
            }`}
            title="Arrow tool"
          >
            <MoveUpRight className="h-3.5 w-3.5" />
            <span>Arrow</span>
          </button>

          {/* Rect */}
          <button
            type="button"
            onClick={() => setTool(tool === 'rect' ? 'select' : 'rect')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
              tool === 'rect'
                ? 'bg-[#1E3A8A] border-blue-500 text-white shadow-sm'
                : 'bg-[#374151] border-slate-600 text-slate-300 hover:text-white'
            }`}
            title="Rectangle tool"
          >
            <Square className="h-3.5 w-3.5" />
            <span>Rect</span>
          </button>

          {/* Clear */}
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-[#374151] border-slate-600 text-rose-400 hover:text-rose-300 hover:bg-slate-700 text-xs font-bold transition-all"
            title="Clear all annotations on current photo"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>

          {/* Color Picker + Width Slider */}
          <div className="flex items-center gap-2 ml-1 pl-2 border-l border-slate-700">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              title="Annotation Color"
            />
            <div className="flex items-center gap-1" title="Stroke Width">
              <span className="text-[10px] text-slate-400 font-semibold">{strokeWidth}px</span>
              <input
                type="range"
                min="1"
                max="10"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-14 h-1.5 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right: Save Image button (was Refresh) */}
        <button
          type="button"
          onClick={handleSaveImage}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-600/80 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition-all active:scale-95"
          title="Save annotated image to photo"
        >
          {saveSuccess ? (
            <>
              <Check className="h-3.5 w-3.5 text-white" />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" />
              <span>Save Image</span>
            </>
          )}
        </button>
      </div>

      {/* CANVAS STAGE */}
      <div
        className={`w-full h-[220px] sm:h-[240px] xl:h-[260px] relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden flex items-center justify-center select-none shrink-0 ${
          tool !== 'select' ? 'cursor-crosshair' : 'cursor-default'
        }`}
      >
        {/* Photo counter overlay positioned absolutely in the top-right corner of actual image container, vertically aligned right underneath the Save Image button */}
        {photoCounter && (
          <div className="absolute top-3 right-3 z-20 rounded-full bg-slate-950/85 border border-slate-800/90 px-3 py-1 text-[11px] font-bold text-slate-300 backdrop-blur shadow-md pointer-events-none">
            {photoCounter}
          </div>
        )}

        <Stage
          width={stageWidth}
          height={stageHeight}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          ref={stageRef}
          className="max-w-full max-h-full"
        >
          <Layer>
            {/* Background Image */}
            {imageSrc && (
              <CanvasBackgroundImage
                src={imageSrc}
                stageWidth={stageWidth}
                stageHeight={stageHeight}
              />
            )}

            {/* Doodles */}
            {lines.map((line, i) => (
              <Line
                key={`line-${i}`}
                points={line.points}
                stroke={line.color}
                strokeWidth={line.strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation="source-over"
              />
            ))}

            {/* Arrows */}
            {arrows.map((arrow, i) => (
              <Arrow
                key={`arrow-${i}`}
                points={arrow.points}
                stroke={arrow.color}
                strokeWidth={arrow.strokeWidth}
                fill={arrow.color}
                pointerLength={10}
                pointerWidth={10}
              />
            ))}

            {/* Rectangles */}
            {rects.map((rect, i) => (
              <Rect
                key={`rect-${i}`}
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                stroke={rect.color}
                strokeWidth={rect.strokeWidth}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
