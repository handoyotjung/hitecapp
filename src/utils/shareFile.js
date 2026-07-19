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
      if (err.name !== 'AbortError') console.error('Share failed:', err);
      return false;
    }
  } 
  // 2. Fallback: Desktop or browser without canShare files support - just download
  else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return false;
  }
}
