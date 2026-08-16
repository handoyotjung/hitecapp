import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Arrow, Rect, Text as KonvaText } from 'react-konva';
import useImage from 'use-image';
import { Edit2, MoveUpRight, Square, Type, RotateCcw, Trash2, Download, Check } from 'lucide-react';

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
  const [tool, setTool] = useState('select'); // 'doodle', 'arrow', 'rect', 'text', 'select'
  const [lines, setLines] = useState([]);
  const [arrows, setArrows] = useState([]);
  const [rects, setRects] = useState([]);
  const [texts, setTexts] = useState([]);
  const [history, setHistory] = useState([]);
  const [color, setColor] = useState('#FF0000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live container size measured via ResizeObserver
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: stageWidth, height: stageHeight });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width: Math.floor(width), height: Math.floor(height) });
        }
      }
    });
    ro.observe(el);
    // Initial measurement
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setContainerSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
    }
    return () => ro.disconnect();
  }, []);

  const liveWidth = containerSize.width || stageWidth;
  const liveHeight = containerSize.height || stageHeight;

  const isDrawing = useRef(false);
  const stageRef = useRef();

  const photoKey = photo?.id || photo?.filename;

  // Save current state snapshot to undo history
  const pushHistory = (newLines = lines, newArrows = arrows, newRects = rects, newTexts = texts) => {
    setHistory(prev => [...prev, { lines: newLines, arrows: newArrows, rects: newRects, texts: newTexts }]);
  };

  // Load annotations from current photo when switching photos
  useEffect(() => {
    if (photo && photo.annotations) {
      setLines(photo.annotations.lines || []);
      setArrows(photo.annotations.arrows || []);
      setRects(photo.annotations.rects || []);
      setTexts(photo.annotations.texts || []);
    } else {
      setLines([]);
      setArrows([]);
      setRects([]);
      setTexts([]);
    }
    setHistory([]);
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

    if (tool === 'text') {
      const val = window.prompt("Enter label text (e.g., Zone 1, Ex d IIC, Temp Class T4):", "Zone 1");
      if (val && val.trim()) {
        const newTexts = [...texts, { x: pos.x, y: pos.y, text: val.trim(), color, fontSize: Math.max(14, strokeWidth * 4) }];
        pushHistory(lines, arrows, rects, texts);
        setTexts(newTexts);
      }
      return;
    }

    isDrawing.current = true;
    pushHistory(lines, arrows, rects, texts);

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
    if (!isDrawing.current || tool === 'select' || tool === 'text') return;
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

  // 4. UNDO BUTTON
  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setLines(previous.lines || []);
    setArrows(previous.arrows || []);
    setRects(previous.rects || []);
    setTexts(previous.texts || []);
  };

  // 5. CLEAR BUTTON
  const handleClear = () => {
    pushHistory(lines, arrows, rects, texts);
    setLines([]);
    setArrows([]);
    setRects([]);
    setTexts([]);
  };

  // 6. SAVE IMAGE BUTTON
  const handleSaveImage = () => {
    if (!stageRef.current || !photo) return;
    const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
    const annotationsObj = { lines, arrows, rects, texts };

    if (onSaveAnnotatedImage) {
      onSaveAnnotatedImage(photo, dataURL, annotationsObj);
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const imageSrc = photo?.annotatedBase64 || photo?.base64 || photo?.url || photo?.thumbnailUrl;

  return (
    <div className="flex flex-col w-full" style={{height:'100%', minHeight:0}}>
      {/* TOOLBAR — sticky to top of the right column under the header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 shrink-0" style={{position:'sticky', top:0, zIndex:10, backdropFilter:'blur(8px)'}}>
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

          {/* Text Tool */}
          <button
            type="button"
            onClick={() => setTool(tool === 'text' ? 'select' : 'text')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
              tool === 'text'
                ? 'bg-[#1E3A8A] border-blue-500 text-white shadow-sm'
                : 'bg-[#374151] border-slate-600 text-slate-300 hover:text-white'
            }`}
            title="Add Text Label (e.g. Zone 1, Ex d)"
          >
            <Type className="h-3.5 w-3.5" />
            <span>Text</span>
          </button>

          {/* Undo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-[#374151] border-slate-600 text-amber-400 hover:text-amber-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:text-amber-400 disabled:cursor-not-allowed text-xs font-bold transition-all"
            title="Undo last annotation"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Undo</span>
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

        {/* Right: Save Image button */}
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

      {/* CANVAS STAGE — fills entire height of its flex-grown container */}
      <div
        ref={containerRef}
        className={`w-full flex-1 min-h-0 relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden flex items-center justify-center select-none ${
          tool !== 'select' ? 'cursor-crosshair' : 'cursor-default'
        }`}
      >
        {/* Photo counter overlay */}
        {photoCounter && (
          <div className="absolute top-3 right-3 z-20 rounded-full bg-slate-950/85 border border-slate-800/90 px-3 py-1 text-[11px] font-bold text-slate-300 backdrop-blur shadow-md pointer-events-none">
            {photoCounter}
          </div>
        )}

        <Stage
          width={liveWidth}
          height={liveHeight}
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
                stageWidth={liveWidth}
                stageHeight={liveHeight}
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

            {/* Text Labels */}
            {texts.map((t, i) => (
              <KonvaText
                key={`text-${i}`}
                x={t.x}
                y={t.y}
                text={t.text}
                fontSize={t.fontSize || 16}
                fill={t.color || '#FF0000'}
                fontStyle="bold"
                shadowColor="#000000"
                shadowBlur={4}
                shadowOffsetX={1}
                shadowOffsetY={1}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
