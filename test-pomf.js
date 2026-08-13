async function test() {
  const fs = require('fs');
  fs.writeFileSync('test.txt', 'hello world');
  
  const formData = new FormData();
  const fileBlob = new Blob(['hello world'], { type: 'text/plain' });
  formData.append('files[]', fileBlob, 'test.txt');
  
  try {
    const res = await fetch('https://pomf.lain.la/upload.php', {
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
