export async function analyzeFiles(files: File[]) {
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await fetch('http://localhost:8000/analyze', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Analysis failed');
  }

  return response.json();
}

export async function checkBackendHealth() {
  try {
    const response = await fetch('http://localhost:8000/health');
    return response.ok;
  } catch {
    return false;
  }
}

