async function check() {
  const res = await fetch("https://firestore.googleapis.com/v1/projects/rehab-science-book/databases/(default)/documents/curriculums/main");
  if (res.status === 404) {
    console.log("Database document NOT FOUND (empty)");
    return;
  }
  const data = await res.json();
  if (data.error) {
    console.log("Error:", data.error.message);
    return;
  }
  console.log("Data exists! Keys:", Object.keys(data.fields || {}));
}
check();
