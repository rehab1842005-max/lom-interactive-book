async function test() {
  const formData = new FormData();
  formData.append('reqtype', 'fileupload');
  const fileBlob = new Blob(['hello world'], { type: 'text/plain' });
  formData.append('fileToUpload', fileBlob, 'test.txt');
  
  try {
    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData
    });
    console.log("Status:", res.status);
    console.log("CORS Headers:", res.headers.get('access-control-allow-origin'));
    const text = await res.text();
    console.log("Body:", text);
  } catch(e) {
    console.error(e);
  }
}
test();
