async function test() {
  const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const formData = new FormData();
  formData.append('key', '6d207e02198a847aa98d0a2a901485a5');
  formData.append('action', 'upload');
  formData.append('source', base64Image);
  formData.append('format', 'json');
  
  try {
    const res = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: formData
    });
    const json = await res.json();
    console.log(json);
  } catch(e) {
    console.error(e);
  }
}
test();
