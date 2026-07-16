# AUREX MOTORS — GT-1

Site-experiência cinematográfico para uma fabricante fictícia de carros
elétricos de luxo. A ideia: entrar num comercial, não num site.

**Tudo é código** — o carro (AUREX GT-1) é 100% procedural (Three.js), sem
nenhum modelo 3D externo, textura baixada ou HDR. O ambiente de estúdio é
gerado com Lightformers.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind v4 · GSAP + ScrollTrigger ·
Lenis · React Three Fiber + drei · postprocessing (Bloom/Vignette) ·
Framer Motion

## Arquitetura

- `src/lib/world.ts` — estado mutável compartilhado (scroll, ponteiro,
  configuração do carro). Lido em `useFrame`, nunca via React state:
  scroll não re-renderiza nada.
- `src/lib/scenes.ts` — o "roteiro do filme": keyframes de câmera, rotação
  do carro e intensidades de luz por cena.
- `src/components/scene-tracker.tsx` — um ScrollTrigger por `[data-scene]`
  escreve `(cena, progresso)` no world; espelha a cena ativa em
  `<html data-scene>` para o CSS (letterbox, dimming do canvas).
- `src/components/scene/camera-rig.tsx` — amostra o roteiro e faz damping
  exponencial: cortes viram movimentos de dolly. Parallax de mouse por cima.
- `src/components/scene/car.tsx` — GT-1 procedural: perfil lateral extrudado
  com bevel pesado (monocoque), canopy de vidro, rodas com 2 estilos de aro,
  interior com tela/volante/bancos, light blade e barra de LED traseira.
- Configurador escreve direto em `world.config`; o carro faz lerp dos
  materiais a cada frame (troca "líquida", zero re-render 3D).
- Galeria tem canvas próprio (4 carros, câmera pan) — o canvas principal
  pausa (`frameloop="never"`) enquanto isso.

## Gotchas documentados

- GSAP interpreta `translateY(115%)` inline como `y` em px — anime `y`,
  não `yPercent`, ou nada se move.
- Tailwind v4: CSS sem `@layer` vence QUALQUER utility (`md:hidden` não
  esconde um `.btn-primary` não-layered).
- Triggers de cena precisam de `end: "bottom top"` — com `bottom bottom`
  há zona morta de 100vh entre seções e o canvas congela/esconde na hora
  errada.
- Emissivos `toneMapped={false}` + Environment forte + Bloom = supernova;
  o vidro precisa de `envMapIntensity` baixo.
- Lenis desativado em `pointer: coarse` (medidas do ScrollTrigger quebram
  em touch; scroll nativo é melhor lá).

## Rodar

```bash
npm install
npm run dev
```
