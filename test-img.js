const fetch = require('node-fetch');
async function test() {
  const formData = new URLSearchParams();
  formData.append('key', '6d207e02198a847aa98d0a2a901485a5');
  formData.append('action', 'upload');
  formData.append('source', 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png');
  formData.append('format', 'json');
  
  const res = await fetch('https://freeimage.host/api/1/upload', {
    method: 'POST',
    body: formData
  });
  const json = await res.json();
  console.log(json);
}
test();
