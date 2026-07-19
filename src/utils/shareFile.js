export async function shareFile(blob, filename, mimeType) {
  const file = new File([blob], filename, { type: mimeType });

  // 1. Check if Web Share API with files is supported - Android Chrome / iOS Safari
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'HitecApp Export',
        text: `Here is your ${filename}`,
      });
      return true; // shared successfully
    } catch (err) {
      if (err.name === 'AbortError') {
        return false; // User explicitly closed/aborted share dialog
      }
      console.warn('Share API failed or user gesture expired, falling back to direct download:', err);
      // Fall through to fallback download below
    }
  } 
  
  // 2. Fallback: Desktop or browser without share support (or expired user gesture) - direct download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return false;
}
