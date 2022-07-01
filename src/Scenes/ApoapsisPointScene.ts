import * as PIXI from "pixi.js";
import NBodySystemEnvironment from "../Environments/NBodySystemEnvironment";
import Scene from "./Scene";
import GravitySystem from "../Systems/GravitySystem";
import MoveParticleSystem from "../Systems/MoveParticleSystem";
import RendererSystem from "../Systems/RendererSystem";
import ShowDistanceSystem from "../Systems/ShowDistanceSystem";
import ShowVectorSystem from "../Systems/ShowVectorSystem";
import TooltipSystem from "../Systems/TooltipSystem";
import TrailRendererSystem from "../Systems/TrailRendererSystem";
import ECSEntity from "../EntityComponentSystem/Entity";
import { addCelestialBody } from "../Entities/CelestialBody";
import { DISP_EXP_DIGITS, EARTH_MASS, SUN_MASS } from "../constants";
import { randInt } from "../Utils/math";
import Vec2 from "../Vec2";
import ParticleComponent from "../Components/ParticleComponent";
import PixiGraphicsRenderComponent from "../Components/PIXIGraphicsRenderComponent";
import { showHtmlExponential } from "../Utils/render";

// TODO: make color of earth and sun consistent throughout
export default class ApoapsisPointScene extends Scene<NBodySystemEnvironment> {
  earthEntity: ECSEntity;
  sunEntity: ECSEntity;

  constructor(htmlContainer: HTMLDivElement) {
    const app = new PIXI.Application();
    const environment = new NBodySystemEnvironment(app);
    environment.timeFactor *= 1.5; // make time go slightly faster :p
    super(htmlContainer, environment);

    this.systems = [
      new GravitySystem(this.entityManager, this.environment),
      new MoveParticleSystem(this.entityManager, this.environment),
      new RendererSystem(this.entityManager, this.environment),
      new TrailRendererSystem(this.entityManager, this.environment),
      new ShowVectorSystem(this.entityManager, this.environment),
      new ShowDistanceSystem(this.entityManager, this.environment),
    ];

    // set up entities
    this.earthEntity = addCelestialBody(this.entityManager, {
      mass: EARTH_MASS,
      color: randInt(0, 0xffffff),
      radius: 20,
      initialPos: this.initialEarthPos,
      initialVel: this.initialEarthVel,
    });
    this.sunEntity = addCelestialBody(this.entityManager, {
      mass: SUN_MASS,
      color: randInt(0, 0xffffff),
      radius: 25,
      fixed: true,
      initialPos: this.initialSunPos,
    });

    // make the earth clickable
    const { pixiGraphics } = this.earthPixiGraphicsComponent;
    pixiGraphics.buttonMode = true; // change cursor
    pixiGraphics.interactive = true;
    pixiGraphics.on("pointerdown", () => {
      const pos = this.earthParticleComponent.pos;
      const delta = pos.sub(this.apoapsisPoint).mag();
      const THRESHOLD = 1e3;
      if (delta < THRESHOLD) {
        this.goalMetStatus.success(
          `You got it within ${showHtmlExponential(
            delta,
            DISP_EXP_DIGITS
          )} m of the real apoapsis point.`
        );
      } else {
        this.goalMetStatus.failure(
          `You werer ${showHtmlExponential(
            delta,
            DISP_EXP_DIGITS
          )} m off the real apoapsis point.`
        );
      }
    });
  }

  reset(): void {
    super.reset();

    this.earthParticleComponent.pos = this.initialEarthPos;
    this.earthParticleComponent.vel = this.initialEarthVel;
  }

  readonly goalMessage = "Click the planet when it reaches its apoapsis point";

  private get initialSunPos(): Vec2 {
    const { width, height } = this.environment.app.renderer;
    const scaleFactor = this.environment.scaleFactor;
    return new Vec2(width / 3 / scaleFactor, height / 2 / scaleFactor);
  }

  private get initialEarthPos(): Vec2 {
    // earth starts at apoapsis
    return this.apoapsisPoint;
  }

  private get apoapsisDist(): number {
    const { width } = this.environment.app.renderer;
    const scaleFactor = this.environment.scaleFactor;
    return width / 2 / scaleFactor;
  }

  private get apoapsisPoint(): Vec2 {
    return this.initialSunPos.addX(this.apoapsisDist);
  }

  private get initialEarthVel(): Vec2 {
    const { width } = this.environment.app.renderer;
    const scaleFactor = this.environment.scaleFactor;

    const G = this.environment.gravitationalConstant;
    const standardGravParameter = G * (EARTH_MASS + SUN_MASS);
    const semimajorAxis = (width / 2 - 150) / scaleFactor;

    // r is essentially at sun because sun mass >> earth mass
    // (and also i'm artificially fixing the sun in place)
    // thats why i'm doing 2 / this.apoapsisDist
    const mag = Math.sqrt(
      standardGravParameter * (2 / this.apoapsisDist - 1 / semimajorAxis)
    );
    console.log({
      standardGravParameter,
      semimajorAxis,
      apoapsisDist: this.apoapsisDist,
      mag,
    });
    return new Vec2(0, mag);
  }

  private get earthPixiGraphicsComponent(): PixiGraphicsRenderComponent {
    return this.entityManager.getComponent<PixiGraphicsRenderComponent>(
      this.earthEntity,
      PixiGraphicsRenderComponent
    )!;
  }

  private get earthParticleComponent(): ParticleComponent {
    return this.entityManager.getComponent<ParticleComponent>(
      this.earthEntity,
      ParticleComponent
    )!;
  }
}