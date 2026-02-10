// 3D PARTICLE NETWORK - OPTIMIZED
(function () {
    const c = document.getElementById("scene");
    const gl = c.getContext("webgl");
    if (!gl) return;
    let resizeTimer;
    function resize() {
        c.width = innerWidth;
        c.height = innerHeight;
        gl.viewport(0, 0, c.width, c.height);
    }
    resize();
    addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
    });
    const N = 100;
    const pos = new Float32Array(N * 3);
    // Pre-allocate projection arrays (avoid GC)
    const prX = new Float32Array(N);
    const prY = new Float32Array(N);
    for (let i = 0; i < N; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 4;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 4;
        pos[i * 3 + 2] = Math.random() * 2 - 3;
    }
    const vSrc = `attribute vec3 a_pos;uniform float u_time;uniform vec2 u_res;uniform vec2 u_mouse;varying float v_alpha;
  void main(){vec3 p=a_pos;p.x+=sin(u_time*.3+p.y*2.)*.15;p.y+=cos(u_time*.25+p.x*2.)*.15;
  float fov=1.5;float z=p.z+2.;vec2 proj=p.xy*fov/z;proj.x*=u_res.y/u_res.x;
  gl_Position=vec4(proj,0.,1.);gl_PointSize=(6./z)*(u_res.y/800.);v_alpha=smoothstep(4.,1.,z)*.6;}`;
    const fSrc = `precision mediump float;varying float v_alpha;
  void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float a=smoothstep(.5,.1,d)*v_alpha;gl_FragColor=vec4(0.,.9,.63,a);}`;
    function mk(t, s) {
        const sh = gl.createShader(t);
        gl.shaderSource(sh, s);
        gl.compileShader(sh);
        return sh;
    }
    const vs = mk(gl.VERTEX_SHADER, vSrc),
        fs = mk(gl.FRAGMENT_SHADER, fSrc);
    const pg = gl.createProgram();
    gl.attachShader(pg, vs);
    gl.attachShader(pg, fs);
    gl.linkProgram(pg);
    gl.useProgram(pg);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
    const aP = gl.getAttribLocation(pg, "a_pos");
    gl.enableVertexAttribArray(aP);
    gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 0, 0);
    const uT = gl.getUniformLocation(pg, "u_time"),
        uR = gl.getUniformLocation(pg, "u_res"),
        uM = gl.getUniformLocation(pg, "u_mouse");
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    let mx = 0,
        my = 0;
    addEventListener("mousemove", (e) => {
        mx = e.clientX - innerWidth / 2;
        my = -(e.clientY - innerHeight / 2);
    });
    const lBuf = gl.createBuffer();
    const lvSrc = `attribute vec2 a_lp;void main(){gl_Position=vec4(a_lp,0.,1.);}`;
    const lfSrc = `precision mediump float;uniform float u_la;void main(){gl_FragColor=vec4(0.,.9,.63,u_la);}`;
    const lvs = mk(gl.VERTEX_SHADER, lvSrc),
        lfs = mk(gl.FRAGMENT_SHADER, lfSrc);
    const lpg = gl.createProgram();
    gl.attachShader(lpg, lvs);
    gl.attachShader(lpg, lfs);
    gl.linkProgram(lpg);
    const aLP = gl.getAttribLocation(lpg, "a_lp"),
        uLA = gl.getUniformLocation(lpg, "u_la");
    // Pre-allocate line buffer (max possible lines = N*(N-1)/2 * 4 floats)
    const maxLines = N * N * 2;
    const lvArr = new Float32Array(maxLines);
    const distThreshSq = 0.22 * 0.22; // squared threshold avoids sqrt
    function draw(t) {
        t *= 0.001;
        gl.clearColor(0.02, 0.02, 0.03, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        const aspect = c.height / c.width;
        let lvCount = 0;
        for (let i = 0; i < N; i++) {
            let x = pos[i * 3],
                y = pos[i * 3 + 1],
                z = pos[i * 3 + 2];
            x += Math.sin(t * 0.3 + y * 2) * 0.15;
            y += Math.cos(t * 0.25 + x * 2) * 0.15;
            const fov = 1.5,
                zz = z + 2;
            prX[i] = ((x * fov) / zz) * aspect;
            prY[i] = (y * fov) / zz;
        }
        // Lines - use squared distance, pre-allocated array
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                const dx = prX[i] - prX[j],
                    dy = prY[i] - prY[j];
                if (dx * dx + dy * dy < distThreshSq) {
                    lvArr[lvCount++] = prX[i];
                    lvArr[lvCount++] = prY[i];
                    lvArr[lvCount++] = prX[j];
                    lvArr[lvCount++] = prY[j];
                }
            }
        }
        if (lvCount > 0) {
            gl.useProgram(lpg);
            gl.bindBuffer(gl.ARRAY_BUFFER, lBuf);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                lvArr.subarray(0, lvCount),
                gl.DYNAMIC_DRAW,
            );
            gl.enableVertexAttribArray(aLP);
            gl.vertexAttribPointer(aLP, 2, gl.FLOAT, false, 0, 0);
            gl.uniform1f(uLA, 0.035);
            gl.drawArrays(gl.LINES, 0, lvCount / 2);
        }
        gl.useProgram(pg);
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.enableVertexAttribArray(aP);
        gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 0, 0);
        gl.uniform1f(uT, t);
        gl.uniform2f(uR, c.width, c.height);
        gl.uniform2f(uM, mx, my);
        gl.drawArrays(gl.POINTS, 0, N);
        requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
})();
// CURSOR - merged into single rAF
const ring = document.getElementById("cursorRing"),
    dot = document.getElementById("cursorDot");
let rx = 0,
    ry = 0,
    cdx = 0,
    cdy = 0;
document.addEventListener("mousemove", (e) => {
    cdx = e.clientX;
    cdy = e.clientY;
    dot.style.transform = `translate(${cdx - 0.5}px,${cdy - 0.5}px) translate(-50%,-50%)`;
    ring.classList.add("visible");
    dot.classList.add("visible");
});
(function ac() {
    rx += (cdx - rx) * 0.12;
    ry += (cdy - ry) * 0.12;
    ring.style.transform = `translate(${rx - 0.5}px,${ry - 0.5}px) translate(-50%,-50%)`;
    requestAnimationFrame(ac);
})();
document
    .querySelectorAll("a,.btn,button,.svc-card,.test-card,.price-card")
    .forEach((el) => {
        el.addEventListener("mouseenter", () => ring.classList.add("hover"));
        el.addEventListener("mouseleave", () =>
            ring.classList.remove("hover"),
        );
    });
// NAV - throttled scroll
let scrollTick = false;
addEventListener("scroll", () => {
    if (!scrollTick) {
        scrollTick = true;
        requestAnimationFrame(() => {
            nav.classList.toggle("scrolled", scrollY > 60);
            scrollTick = false;
        });
    }
});
const nav = document.getElementById("nav");
const hb = document.getElementById("hamburger"),
    nm = document.getElementById("navMenu");
hb.addEventListener("click", () => {
    hb.classList.toggle("open");
    nm.classList.toggle("open");
});
nm.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
        hb.classList.remove("open");
        nm.classList.remove("open");
    }),
);
// SCROLL REVEAL
const obs = new IntersectionObserver(
    (en) => {
        en.forEach((e) => {
            if (e.isIntersecting) {
                e.target.classList.add("vis");
                obs.unobserve(e.target);
            }
        });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
);
document.querySelectorAll(".sr").forEach((el) => obs.observe(el));
// FAQ
document.querySelectorAll(".faq-q").forEach((q) => {
    q.addEventListener("click", () => {
        const item = q.parentElement;
        const o = item.classList.contains("open");
        document
            .querySelectorAll(".faq-item")
            .forEach((i) => i.classList.remove("open"));
        if (!o) item.classList.add("open");
    });
});
// COUNTER
const cObs = new IntersectionObserver(
    (en) => {
        en.forEach((e) => {
            if (e.isIntersecting) {
                document.querySelectorAll("[data-count]").forEach((el) => {
                    const tgt = +el.dataset.count;
                    let cur = 0;
                    const inc = tgt / 35;
                    const tm = setInterval(() => {
                        cur += inc;
                        if (cur >= tgt) {
                            el.textContent = tgt + "+";
                            clearInterval(tm);
                        } else el.textContent = Math.floor(cur) + "+";
                    }, 40);
                });
                cObs.unobserve(e.target);
            }
        });
    },
    { threshold: 0.5 },
);
const sb = document.querySelector(".stats-bar");
if (sb) cObs.observe(sb);
// SMOOTH SCROLL
document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", function (e) {
        e.preventDefault();
        const t = document.querySelector(this.getAttribute("href"));
        if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});
// 3D TILT - throttled with rAF
document
    .querySelectorAll(".svc-card,.price-card,.test-card")
    .forEach((card) => {
        let tiltRaf = 0,
            rect = null;
        card.addEventListener("mousemove", (e) => {
            if (tiltRaf) return;
            tiltRaf = requestAnimationFrame(() => {
                if (!rect) rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                card.style.transform = `translateY(-6px) perspective(600px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`;
                tiltRaf = 0;
            });
        });
        card.addEventListener("mouseleave", () => {
            rect = null;
            card.style.transform = "";
            card.style.transition = "all .5s cubic-bezier(.22,1,.36,1)";
        });
        card.addEventListener("mouseenter", () => {
            rect = card.getBoundingClientRect();
            card.style.transition = "transform .1s";
        });
    });
