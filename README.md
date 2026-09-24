# AUREX MOTORS — GT-1

Site-experiência cinematográfico para uma fabricante fictícia de carros
elétricos de luxo. A ideia: entrar num comercial, não num site.

O carro (AUREX GT-1) usa o modelo 3D do Ferrari 458 Italia que acompanha os
exemplos do three.js (`public/models/ferrari-opt.glb`, comprimido com Draco),
com os materiais trocados em código para a identidade AUREX. O ambiente de
estúdio é gerado com Lightformers, sem HDR baixado. A marca AUREX é fictícia.

## Créditos do modelo 3D

Modelo Ferrari 458 Italia, de [vicent091036](https://sketchfab.com/models/57bf6cc56931426e87494f554df1dab6),
distribuído nos exemplos do [three.js](https://github.com/mrdoob/three.js)
(`examples/models/gltf/ferrari.glb`). Confira a licença do autor antes de
qualquer uso comercial; "Ferrari" é marca de terceiros.

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
- `src/components/scene/car.tsx`: carrega o GLB (decoder Draco em
  `public/draco/`), clona a cena por instância e religa os materiais: pintura
  configurável, detalhes vermelhos e assinatura de luz emissiva.
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
