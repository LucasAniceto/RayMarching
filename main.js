// Shader sources
const vertexShaderSource = `
    attribute vec3 position;
    void main() {
        gl_Position = vec4(position, 1.0);
    }
`;

const fragmentShaderSource = `
    precision highp float;
    uniform vec2 iResolution;
    uniform float iTime;
    uniform vec2 iMouse;

    float sdSphere(vec3 p, float s) {
        return length(p) - s;
    }

    float sdTorus(vec3 p, vec2 t) {
        vec2 q = vec2(length(p.xz) - t.x, p.y);
        return length(q) - t.y;
    }

    float smin(float a, float b, float k) {
        float h = max(k - abs(a - b), 0.0) / k;
        return min(a, b) - h * h * h * k * (1.0 / 6.0);
    }

    const int NUM_PLANETS = 8;
    const int MAX_MOONS = 5; 
    
    int getMoonCount(int planetIndex) {
        if (planetIndex == 0) return 0;      
        if (planetIndex == 1) return 0;      
        if (planetIndex == 2) return 1;      
        if (planetIndex == 3) return 2;      
        if (planetIndex == 4) return 4;      
        if (planetIndex == 5) return 5;      
        if (planetIndex == 6) return 3;      
        if (planetIndex == 7) return 2;      
        return 0;
    }

 vec3 getPlanetPosition(int i, float time) {
    float orbitRadius = 2.0 + float(i) * 0.5;
    float orbitSpeed = 1.0 / (1.0 + float(i) * 0.2);
    float angle = time * orbitSpeed;
    
    float inclinationX = sin(float(i) * 0.8) * 1.2;
    float inclinationZ = cos(float(i) * 0.9) * 1.2;

    float transitionFactor = clamp(time / 5.0, 0.0, 1.0);
    float currentRadius = mix(0.0, orbitRadius, transitionFactor);

    if (time < 40.0) {
        return vec3(
            cos(angle) * currentRadius,
            sin(angle) * inclinationX * transitionFactor,
            sin(angle) * currentRadius * inclinationZ
        );
    }

    float returnTime = clamp((time - 40.0) / 10.0, 0.0, 1.0);
    vec3 orbitPos = vec3(
        cos(angle) * currentRadius,
        sin(angle) * inclinationX,
        sin(angle) * currentRadius * inclinationZ
    );

    vec3 centerPos = vec3(0.0);
    vec3 pos = mix(orbitPos, centerPos, returnTime);

    if (time > 50.0) {
        float smallMovement = 0.1;
        pos += smallMovement * vec3(
            sin(time + float(i) * 0.5),
            cos(time * 0.3 + float(i) * 0.7),
            sin(time * 0.2 + float(i) * 0.9)
        );
    }

    return pos;
}

    vec3 getMoonPosition(vec3 planetPos, float planetSize, int moonIndex, float time) {
        float moonOrbitRadius = planetSize * 2.0 + float(moonIndex) * 0.15;
        float moonSpeed = 3.0 - float(moonIndex) * 0.2;
        float moonIncX = sin(float(moonIndex) * 1.5) * 0.8;
        float moonIncZ = cos(float(moonIndex) * 1.7) * 0.8;
        float moonAngle = time * moonSpeed + float(moonIndex) * 7.0;
        
        return planetPos + vec3(
            cos(moonAngle) * moonOrbitRadius,
            sin(moonAngle) * moonIncX,
            sin(moonAngle) * moonOrbitRadius * moonIncZ
        );
    }

    float map(vec3 p) {
        float sun = sdSphere(p, 0.5);
        
        float planets = 1e10;
        float allMoons = 1e10;
        
        for (int i = 0; i < NUM_PLANETS; i++) {
            vec3 planetPos = getPlanetPosition(i, iTime);
            float planetSize = 0.2 + float(i) * 0.03;
            
            float planetDist = sdSphere(p - planetPos, planetSize);
            
            if (i == 5) {
                vec3 pRing = p - planetPos;
                vec2 torusParams = vec2(0.4, 0.03);
                float ringDist = sdTorus(pRing, torusParams);
                planetDist = min(planetDist, ringDist);
            }
            
            planets = smin(planets, planetDist, 0.5);
            
            int moonCount = getMoonCount(i);
            
            for (int m = 0; m < MAX_MOONS; m++) {
                if (m >= moonCount) break;
                
                vec3 moonPos = getMoonPosition(planetPos, planetSize, m, iTime);
                float moonSize = planetSize * 0.2 + float(m) * 0.01;
                
                float moonDist = sdSphere(p - moonPos, moonSize);
                
                allMoons = smin(allMoons, moonDist, 0.3);
            }
        }
        
        float result = smin(sun, planets, 0.8);
        result = smin(result, allMoons, 0.5);
        
        return result;
    }

    vec3 calcNormal(vec3 p) {
        const float eps = 0.01;  
        vec2 h = vec2(eps, 0.0);
        return normalize(vec3(
            map(p + h.xyy) - map(p - h.xyy),
            map(p + h.yxy) - map(p - h.yxy),
            map(p + h.yyx) - map(p - h.yyx)
        ));
    }

    vec3 getObjectColor(vec3 p) {
        if (length(p) < 0.6) {
            return vec3(1.0, 0.7, 0.0); 
        }
        
        float minDist = 1e10;
        int hitPlanet = -1;
        int hitMoon = -1;
        bool isRing = false;
        
        for (int i = 0; i < NUM_PLANETS; i++) {
            vec3 planetPos = getPlanetPosition(i, iTime);
            float planetSize = 0.2 + float(i) * 0.03;
            
            float planetDist = length(p - planetPos) - planetSize;
            
            if (i == 5) {
                vec3 pRing = p - planetPos;
                vec2 torusParams = vec2(0.4, 0.03);
                float ringDist = sdTorus(pRing, torusParams);
                
                if (ringDist < planetDist && ringDist < minDist) {
                    minDist = ringDist;
                    hitPlanet = i;
                    hitMoon = -1;
                    isRing = true;
                } else if (planetDist < minDist) {
                    minDist = planetDist;
                    hitPlanet = i;
                    hitMoon = -1;
                    isRing = false;
                }
            } 
            else if (planetDist < minDist) {
                minDist = planetDist;
                hitPlanet = i;
                hitMoon = -1;
                isRing = false;
            }
            
            int moonCount = getMoonCount(i);
            for (int m = 0; m < MAX_MOONS; m++) {
                if (m >= moonCount) break;
                
                vec3 moonPos = getMoonPosition(planetPos, planetSize, m, iTime);
                float moonSize = planetSize * 0.2 + float(m) * 0.01;
                float moonDist = length(p - moonPos) - moonSize;
                
                if (moonDist < minDist) {
                    minDist = moonDist;
                    hitPlanet = i;
                    hitMoon = m;
                    isRing = false;
                }
            }
        }
        
        vec3 color;
        
        if (hitMoon == -1) {
            if (hitPlanet == 0) color = vec3(0.7, 0.5, 0.3); 
            else if (hitPlanet == 1) color = vec3(0.9, 0.7, 0.3); 
            else if (hitPlanet == 2) color = vec3(0.2, 0.5, 0.8); 
            else if (hitPlanet == 3) color = vec3(0.9, 0.2, 0.1); 
            else if (hitPlanet == 4) color = vec3(0.9, 0.6, 0.4); 
            else if (hitPlanet == 5) {
                if (isRing) color = vec3(0.9, 0.9, 0.7); 
                else color = vec3(0.9, 0.8, 0.3); 
            }
            else if (hitPlanet == 6) color = vec3(0.2, 0.6, 0.9); 
            else if (hitPlanet == 7) color = vec3(0.1, 0.3, 0.8); 
            else color = vec3(1.0); 
        } 
        else {
            if (hitPlanet == 2) color = vec3(0.8, 0.8, 0.8); 
            else if (hitPlanet == 3) color = vec3(0.7, 0.7, 0.7) - vec3(0.05) * float(hitMoon); 
            else if (hitPlanet == 4) color = vec3(0.9, 0.8, 0.6) - vec3(0.07) * float(hitMoon); 
            else if (hitPlanet == 5) color = vec3(0.8, 0.8, 0.7) - vec3(0.05) * float(hitMoon); 
            else if (hitPlanet == 6) color = vec3(0.6, 0.7, 0.8) - vec3(0.07) * float(hitMoon); 
            else if (hitPlanet == 7) color = vec3(0.5, 0.6, 0.7) - vec3(0.1) * float(hitMoon);  
            else color = vec3(0.8); 
        }
        
        return color;
    }

    void main() {
        vec2 fragCoord = gl_FragCoord.xy;
        vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
        
        vec3 ro = vec3(2.0, 3.5, 7.5);
        vec3 target = vec3(0.0, 0.0, 0.0);
        vec3 forward = normalize(target - ro);
        vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
        vec3 up = cross(forward, right);
        vec3 rd = normalize(forward + right * uv.x + up * uv.y);
        
        vec3 col = vec3(0.01, 0.01, 0.02);  
        float t = 0.0;
        
        const int MAX_STEPS = 40;  
        const float MAX_DIST = 40.0;  
        const float SURF_DIST = 0.001;
        
        bool hit = false;
        
        for (int i = 0; i < MAX_STEPS; i++) {
            vec3 p = ro + rd * t;
            float d = map(p);
            
            if (d < SURF_DIST) {
                hit = true;
                break;
            }
            
            t += d * 0.8; 
            if (t > MAX_DIST) break;
        }
        
        if (hit) {
            vec3 p = ro + rd * t;
            
            vec3 color = getObjectColor(p);
            
            vec3 normal = calcNormal(p);
            vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
            float diff = max(0.3, dot(normal, lightDir));
            
            col = color * diff;
        } else {
            float stars = step(0.985, fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453));
            col += vec3(stars);
        }
        
        gl_FragColor = vec4(col, 1.0);
    }
`;
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

if (!gl) {
    alert('WebGL not supported');
    throw new Error('WebGL not supported');
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    
    return program;
}

const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

const program = createProgram(gl, vertexShader, fragmentShader);
gl.useProgram(program);

const vertices = new Float32Array([
    -1.0, -1.0, 0.0,
     1.0, -1.0, 0.0,
    -1.0,  1.0, 0.0,
    -1.0,  1.0, 0.0,
     1.0, -1.0, 0.0,
     1.0,  1.0, 0.0
]);

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const positionAttribute = gl.getAttribLocation(program, 'position');
gl.enableVertexAttribArray(positionAttribute);
gl.vertexAttribPointer(positionAttribute, 3, gl.FLOAT, false, 0, 0);

const resolutionUniform = gl.getUniformLocation(program, 'iResolution');
const timeUniform = gl.getUniformLocation(program, 'iTime');
const mouseUniform = gl.getUniformLocation(program, 'iMouse');

let mouseX = 0;
let mouseY = 0;

canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = canvas.height - e.clientY; 
});

let startTime = Date.now();

function render() {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) / 1000; 
    
    gl.uniform2f(resolutionUniform, canvas.width, canvas.height);
    gl.uniform1f(timeUniform, elapsedTime);
    gl.uniform2f(mouseUniform, mouseX, mouseY);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    requestAnimationFrame(render);
}

render();