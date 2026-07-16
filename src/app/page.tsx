import dynamic from "next/dynamic";
import SmoothScroll from "@/components/smooth-scroll";
import SceneTracker from "@/components/scene-tracker";
import Cursor from "@/components/cursor";
import Loader from "@/components/loader";
import Nav from "@/components/nav";
import Hero from "@/components/sections/hero";
import { Film, Design, Performance, Interior } from "@/components/sections/story";
import Configurator from "@/components/sections/configurator";
import Finale from "@/components/sections/finale";
import Footer from "@/components/footer";

// the 3D bundles are heavy — split them out of the first paint
const CanvasRoot = dynamic(() => import("@/components/scene/canvas-root"));
const Gallery = dynamic(() => import("@/components/sections/gallery"));

export default function Home() {
  return (
    <>
      <Loader />
      <SmoothScroll />
      <SceneTracker />
      <Cursor />
      <Nav />

      <CanvasRoot />

      <main className="relative z-10">
        <Hero />
        <Film />
        <Design />
        <Performance />
        <Interior />
        <Gallery />
        <Configurator />
        <Finale />
      </main>

      <Footer />
    </>
  );
}
