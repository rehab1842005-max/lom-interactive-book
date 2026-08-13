async function test() {
  const formData = new FormData();
  formData.append('upload_preset', 'docs_upload_example_us_preset');
  formData.append('file', 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png');
  
  const res = await fetch('https://api.cloudinary.com/v1_1/demo/image/upload', {
    method: 'POST',
    body: formData
  });
  const json = await res.json();
  console.log(json.secure_url || json.error);
}
test();
