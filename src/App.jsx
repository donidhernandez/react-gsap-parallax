import React, {useRef} from "react";
import {gsap} from "gsap";
import {useGSAP} from "@gsap/react";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {ScrollSmoother} from "gsap/ScrollSmoother";

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother);

function App() {
    const spaceshipRef = useRef(null);
    const enemyRef = useRef(null);
    const shootRef = useRef(null);

    useGSAP(() => {
        // 1. Smooth scrolling
        ScrollSmoother.create({
            wrapper: "#smooth-wrapper",
            content: "#smooth-content",
            smooth: 1.5,
            effects: true,
            smoothTouch: 0.1,
        });

        // 2. Animaciones iniciales
        const introTimeline = gsap.timeline();
        introTimeline
            .from('.sky', {opacity: 0, y: -200, duration: 1.5, ease: 'power2.out'})
            .from('.back-cloud', {opacity: 0, x: 200, duration: 1.2, ease: 'power2.out'}, '<')
            .from('.front-cloud', {opacity: 0, x: -200, duration: 1.2, ease: 'power2.out'}, '<')
            .from('.spaceship', {x: '-20vw', scale: 0.5, opacity: 0, duration: 1, ease: 'back.out(1.7)'}, '-=0.5')
            .from('.main-title', {opacity: 0, y: 200, filter: 'blur(10px)', duration: 1.8, ease: 'power2.out'}, '-=0.8')
            .from('.subtitle', {
                opacity: 0,
                y: 100,
                filter: 'blur(10px)',
                duration: 1.2,
                ease: 'elastic.out(1, 0.6)'
            }, '-=1.2');

        // 3. Scroll-trigger animations
        const scrollTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: ".section-wrapper",
                start: "top top",
                end: "+=10000",
                scrub: true,
                pin: true
            }
        });

        // 3.1. Secuencia de animación de textos
        scrollTimeline
            // Primero ocultar título y subtítulo (usando fromTo para que reaparezcan al hacer scroll hacia arriba)
            .fromTo('.main-title, .subtitle',
                {opacity: 1, y: 0},
                {opacity: 0, y: -100, duration: 0.3},
                0)
            .fromTo('.scroll-indicator',
                {opacity: 1, y: 0},
                {opacity: 0, y: 50, duration: 0.3},
                0)
            // Luego mostrar el subheading
            .fromTo('.subheading',
                {opacity: 0, y: 100},
                {opacity: 1, y: 0, duration: 0.4},
                0.3)
            // Finalmente ocultar el subheading antes de que aparezcan las naves
            .to('.subheading', {opacity: 0, y: -100, duration: 0.3}, 0.8);

        // 3.2. Parallax de fondo
        scrollTimeline
            .to('.sky-moon', {xPercent: -20}, 0)
            .to('.back-cloud', {xPercent: -10}, 0)

            // Vuelo de la nave (empieza en 1.2, dura 3 segundos)
            .to(
                spaceshipRef.current,
                {
                    x: '110vw',
                    duration: 3,
                    ease: 'sine.inOut',
                    onUpdate() {
                        const prog = this.progress();
                        const frame = Math.min(7, Math.ceil(prog * 7));
                        spaceshipRef.current.src = `/spaceship/spaceship_frame_${frame}.png`;
                    }
                },
                1.0
            )
            // Vuelo del enemigo (empieza en 1.2, dura 3 segundos)
            .to(
                enemyRef.current,
                {
                    x: '-110vw',
                    duration: 3,
                    ease: 'sine.inOut',
                    onUpdate() {
                        const prog = this.progress();
                        const frame = Math.min(4, Math.ceil(prog * 4));
                        enemyRef.current.src = `/enemies/enemy_frame_${frame}.png`;
                    }
                },
                1.2
            )
            // Disparo sincronizado: empieza cuando la spaceship está en 25% de su recorrido
            // y llega cuando ambas naves están en el centro (50% de su recorrido)
            .to(
                shootRef.current,
                {
                    keyframes: [
                        {x: '10vw', opacity: 1, duration: 0},
                        {x: '90vw', opacity: 1, duration: 1.5, ease: 'power2.out'},
                        {x: '90vw', opacity: 0, duration: 0.1}
                    ],
                    onUpdate() {
                        const prog = this.progress();
                        const frame = (Math.ceil(prog * 12) % 2 === 0) ? 2 : 1;
                        const type = (Math.ceil(prog * 6) % 2 === 0) ? 'high' : 'low';
                        shootRef.current.src = `/shoots/exhaust_${type}_frame_${frame}.png`;

                        // Detección de colisión durante la animación
                        if (prog > 0 && prog < 0.95) {
                            const shootRect = shootRef.current.getBoundingClientRect();
                            const enemyRect = enemyRef.current.getBoundingClientRect();

                            if (checkCollision(shootRect, enemyRect)) {

                                // Hacer que el disparo desaparezca inmediatamente
                                gsap.to(shootRef.current, {
                                    opacity: 0,
                                    scale: 0.5,
                                    duration: 0.1
                                });

                                // Ocultar la nave enemiga
                                gsap.to(enemyRef.current, {
                                    opacity: 0,
                                    duration: 0.1
                                });

                                console.log('¡IMPACTO! Nave enemiga destruida con explosión');
                            }
                        }
                    }
                },
                1.95
            )


        // 4. Animaciones de scroll para la sección Luna
        gsap.timeline({
            scrollTrigger: {
                trigger: ".moon-scene",
                start: "top bottom",
                end: "bottom top",
                scrub: 1
            }
        })
            // Parallax diferenciado para cada capa
            .to('.moon-earth', {y: '-20%'}, 0)
            .to('.moon-back', {y: '-10%'}, 0)
            .to('.moon-mid', {y: '-5%'}, 0)
            .to('.moon-front', {y: '5%'}, 0)
            .to('.moon-floor', {y: '10%'}, 0)
            // Animación del título
            .to('.moon-title', {y: '-30%', scale: 1.1}, 0);
    }, []);

    function checkCollision(rect1, rect2) {
        return !(rect1.right < rect2.left ||
            rect1.left > rect2.right ||
            rect1.bottom < rect2.top ||
            rect1.top > rect2.bottom);
    }

    return (
        <>
            <div id="smooth-wrapper">
                <div id="smooth-content">
                    <section className="section-wrapper min-h-screen relative">
                        <section className="h-full w-full">

                            <img src="/skies/Sky_sky.png" alt="Sky sky"
                                 className="sky w-full h-full object-cover absolute z-0"/>
                            <img src="/skies/sky_moon.png" alt="Sky moon"
                                 className="sky-moon w-full h-full object-contain absolute z-10"/>
                            <div className="h-full w-full object-cover absolute z-10">
                                <img src="/skies/sky_clouds.png" alt="Sky clouds"
                                     className="back-cloud w-full h-full object-cover absolute z-10"/>
                                <img src="/skies/sky_clouds.png" alt="Sky clouds"
                                     className="back-cloud w-full h-full object-cover absolute z-10 translate-x-1/2"/>
                            </div>

                            <img src="/skies/Sky_back_mountain.png" alt="Sky back mountain"
                                 className="back-mountain w-full h-full object-cover absolute z-20"/>
                            <img src="/skies/sky_front_mountain.png" alt="Sky front mountain"
                                 className="front-mountain w-full h-full object-cover absolute z-30"/>
                            <img src="/skies/sky_cloud_floor_2.png" alt="Sky cloud floor 2"
                                 className="cloud-floor-2 w-full h-full object-cover absolute z-30 back-cloud"/>
                            <img src="/skies/sky_cloud_floor.png" alt="Sky cloud floor"
                                 className="cloud-floor w-full h-full object-cover absolute z-40 back-cloud"/>
                            <img src="/skies/Sky_front_cloud.png" alt="Sky front cloud"
                                 className="front-cloud w-full h-full object-cover absolute z-50"/>
                            <img src="/skies/Sky_cloud_single.png" alt="Sky single cloud"
                                 className="cloud-single w-full h-full object-cover absolute z-60"/>
                            <img
                                ref={spaceshipRef}
                                src={`/spaceship/spaceship_frame_1.png`}
                                alt={`Spaceship Frame `}
                                className="spaceship w-52 h-40 object-contain absolute top-1/2 -translate-y-1/2 -left-52 z-90"/>


                            <img
                                ref={shootRef}
                                src={`/shoots/exhaust_low_frame_1.png`}
                                alt={`Shoot`}
                                className="shoot w-20 h-10 object-contain absolute top-1/2 -translate-y-1/2 -left-20 z-88 opacity-0"/>

                            <img
                                ref={enemyRef}
                                src={`/enemies/enemy_frame_1.png`}
                                alt={`Enemy Frame 1`}
                                className="enemy w-40 h-32 object-contain absolute top-1/2 -translate-y-1/2 -right-52 z-85"/>


                        </section>

                        <div
                            className="content-wrapper absolute inset-0 z-80 flex flex-col justify-center items-center">
                            <h1 className="main-title font-space-grotesk text-8xl font-bold">Doni Spot</h1>
                            <p className="subtitle font-space-grotesk text-3xl font-light">Presenta</p>

                            <h2 className="subheading font-space-grotesk text-9xl font-black opacity-0">Space
                                Invaders</h2>
                        </div>

                        <div
                            className="scroll-indicator  w-full text-center animate-bounce text-2xl absolute bottom-10 mx-auto z-90 font-space-grotesk">
                            <span>Haz scroll para comenzar</span>
                        </div>
                    </section>

                    <section className="section-wrapper min-h-screen relative w-full overflow-hidden">
                        {/* Moon Scene Container */}
                        <section className="moon-scene h-screen w-full relative">
                            {/* Sky Background - Base layer */}
                            <img
                                src="/moon/moon_sky.png"
                                alt="Moon sky"
                                className="moon-sky w-full h-full object-cover absolute inset-0 z-0"
                            />

                            {/* Earth in distance - Parallax element */}
                            <img
                                src="/moon/moon_earth.png"
                                alt="Moon earth"
                                className="moon-earth w-full h-full object-contain absolute inset-0 z-10"
                            />

                            {/* Background mountains/terrain - Slowest parallax */}
                            <img
                                src="/moon/moon_back.png"
                                alt="Moon background terrain"
                                className="moon-back w-full h-full object-cover absolute inset-0 z-20"
                            />

                            {/* Mid-ground terrain - Medium parallax */}
                            <img
                                src="/moon/moon_mid.png"
                                alt="Moon mid terrain"
                                className="moon-mid w-full h-full object-cover absolute inset-0 z-30"
                            />

                            {/* Foreground elements - Faster parallax */}
                            <img
                                src="/moon/moon_front.png"
                                alt="Moon front terrain"
                                className="moon-front w-full h-full object-cover absolute inset-0 z-40"
                            />

                            {/* Floor/Surface - Fastest parallax */}
                            <img
                                src="/moon/moon_floor.png"
                                alt="Moon surface floor"
                                className="moon-floor w-full h-full object-cover absolute inset-0 z-50"
                            />
                        </section>

                        {/* Optional: Content overlay for this section */}
                        <div
                            className="moon-content absolute inset-0 z-60 flex flex-col justify-center items-center pointer-events-none">
                            {/* Add any text or UI elements for this moon section here */}

                            <h1 className="text-6xl font-bold text-white mb-8">
                                Explora el espacio
                            </h1>

                            <h2 className="moon-title text-7xl font-black font-space-grotesk text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse drop-shadow-[0_0_10px_rgba(255,255,255,0.7)] filter-none">
                                Dale al botón de Me gusta
                            </h2>

                        </div>
                    </section>
                </div>
            </div>

        </>
    );
}

export default App;
