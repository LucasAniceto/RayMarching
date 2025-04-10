🌌 Solar System Animation — WebGL + Ray Marching

A solar system animation built with JavaScript, WebGL, and ray marching. This project simulates a 3D-style solar system that expands and retracts it in 40 seconds, using only fragment shaders for rendering.

🚀 Overview



![2025-03-2618-39-54-ezgif com-video-to-gif-converter](https://github.com/user-attachments/assets/49ed66da-3987-43ac-80c6-47e0be545d51)


This project explores the power of WebGL and ray marching, creating a stylized solar system rendered entirely in the fragment shader. It demonstrates how ray marching can produce smooth, interactive 3D visuals directly in the browser—without traditional 3D models or geometry.
🌀 Features

    🌍 Procedurally-rendered planets and orbits
    ⏱️ 40-second cycle of expansion and retraction
    🌑 Realistic lighting and soft shadows using distance fields
    🎨 All visuals handled in a single fragment shader (ray marching)
    📦 Lightweight — no external 3D libraries used

🧪 Technologies Used

    JavaScript — Manages WebGL context and animation loop
    WebGL — Low-level graphics API to render to the browser canvas
    GLSL (Shader Language) — Implements ray marching for rendering scene
    HTML + CSS — Simple, responsive layout to host the canvas

🎥 How It Works

The scene is rendered using ray marching, a technique that casts rays into a virtual 3D scene defined by signed distance functions (SDFs). Each celestial body (planets, sun, moons) is described mathematically and rendered based on distance fields, with custom lighting and orbiting logic built into the shader.

📂 Project Structure

    /solar-system-raymarching
    │
    ├── index.html          # Main HTML file
    ├── style.css           # Basic styling for the page
    ├── main.js             # WebGL setup and animation loop | GLSL fragment shader (ray marching logic)


🛠️ Getting Started

    Clone the repository: git clone https://github.com/LucasAniceto/RayMarching
    Open index.html with a localhost (live-server on VScode)
✨ Acknowledgments

This project is inspired by the TV show The Big Bang Theory and was made for the Computer Graphics course at college.

📜 License

MIT License. Feel free to fork, remix, and learn from it.



