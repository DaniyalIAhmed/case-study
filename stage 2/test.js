import fetch from "node-fetch";

const testRequest = async () => {
  const response = await fetch("http://localhost:4601/api/user/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "testuser", password: "testpassword" }),
  });

  const data = await response.json();
  console.log(data);
};

testRequest();
