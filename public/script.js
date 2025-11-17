// YOUR DEPLOYED CLOUD RUN SERVICE URL
const API_URL = 'https://clarity-check-v2-707998044973.us-central1.run.app/clarity-check';

document.getElementById('clarityForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevents the default form submission (page reload)

    // 1. Get user input
    const topic = document.getElementById('topicInput').value;
    const understanding = document.getElementById('understandingInput').value;
    const resultDiv = document.getElementById('result');

    // 2. Show loading state
    resultDiv.innerHTML = '<h2>Analyzing...</h2><p>Please wait while the Gemini AI checks your clarity...</p>';

    try {
        // 3. Call your deployed Cloud Run API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ topic, understanding }),
        });

        // Check for HTTP errors (e.g., 500 server error)
        if (!response.ok) {
             throw new Error(`API call failed with status: ${response.status}`);
        }

        const data = await response.json();
        
        // 4. Display the results
        // Use a color based on the verdict for emphasis
        let verdictColor = '#006400'; // Dark Green (Good)
        if (data.verdict.includes('CLARITY REQUIRED')) {
            verdictColor = '#FFA500'; // Orange (Medium)
        } else if (data.verdict.includes('CRITICAL')) {
            verdictColor = '#8B0000'; // Dark Red (Bad)
        }

        resultDiv.innerHTML = `
            <h2>Clarity Check Complete!</h2>
            <p><strong>Meeting Topic:</strong> ${topic}</p>
            <p style="padding: 10px; border-radius: 4px; background-color: #f0f0f0;">
                <strong>Verdict:</strong> 
                <span style="font-weight: bold; color: ${verdictColor};">${data.verdict}</span>
            </p>
            <p><strong>Clarity Score:</strong> <span style="font-size: 1.2em;">${data.clarity_score}/10</span></p>
            
            <h3>Gaps & Actionable Insights:</h3>
            <ul>
                ${data.gaps_insights.map(gap => `<li>${gap}</li>`).join('')}
            </ul>
        `;

    } catch (error) {
        // 5. Display API error
        resultDiv.innerHTML = `<p style="color: red;">Error processing request: ${error.message}</p>`;
        console.error("API Error:", error);
    }
});

// --- 3D Background Animation (Donuts) ---
let scene, camera, renderer, donuts;

function init3DBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return; // Exit if canvas not found (e.g., during development without HTML)

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true, // Allow transparent background in Three.js if needed
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Create Donuts
    donuts = [];
    const geometry = new THREE.TorusGeometry(0.7, 0.3, 16, 100); // Torus (donut) shape
    const material = new THREE.MeshStandardMaterial({ color: 0x42a5f5, roughness: 0.5, metalness: 0.8 }); // Blue, metallic

    for (let i = 0; i < 15; i++) { // Create 15 donuts
        const donut = new THREE.Mesh(geometry, material);
        
        // Random positions and rotations
        donut.position.x = (Math.random() - 0.5) * 20;
        donut.position.y = (Math.random() - 0.5) * 20;
        donut.position.z = (Math.random() - 0.5) * 20;

        donut.rotation.x = Math.random() * Math.PI;
        donut.rotation.y = Math.random() * Math.PI;
        donut.rotation.z = Math.random() * Math.PI;

        const scale = Math.random() * 0.5 + 0.5; // Random scale between 0.5 and 1
        donut.scale.set(scale, scale, scale);

        donuts.push(donut);
        scene.add(donut);
    }

    // Animation Loop
    const animate = () => {
        requestAnimationFrame(animate);

        donuts.forEach(donut => {
            donut.rotation.x += 0.005;
            donut.rotation.y += 0.005;
            donut.rotation.z += 0.003;

            // Simple movement (optional)
            donut.position.y += Math.sin(Date.now() * 0.0001 + donut.id) * 0.001; 
            donut.position.x += Math.cos(Date.now() * 0.0001 + donut.id) * 0.001; 
        });

        renderer.render(scene, camera);
    };

    animate();

    // Handle window resizing
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Initialize the 3D background when the window loads
window.addEventListener('load', init3DBackground);