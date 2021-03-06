import * as PIXI from "pixi.js";
import ParticleComponent from "../Components/ParticleComponent";
import { ShowDistanceData } from "../Components/ShowDistanceComponent";
import {
  ASTRONIMICAL_UNIT,
  EARTH_COLOR,
  EARTH_MASS,
  SUN_COLOR,
  SUN_MASS,
} from "../constants";
import { addCelestialBody } from "../Entities/CelestialBody";
import ECSEntity from "../EntityComponentSystem/Entity";
import NBodySystemEnvironment from "../Environments/NBodySystemEnvironment";
import DraggableItemSystem from "../Systems/DraggableItemSystem";
import GravitySystem from "../Systems/GravitySystem";
import RendererSystem from "../Systems/RendererSystem";
import SelectableItemSystem from "../Systems/SelectableItemSystem";
import ShowDistanceSystem from "../Systems/ShowDistanceSystem";
import ShowVectorSystem from "../Systems/ShowVectorSystem";
import Vec2 from "../Vec2";
import Scene from "./Scene";

const ANSWER = -2;

// TODO: change the goal for this one
export default class ForcesScene extends Scene<NBodySystemEnvironment> {
  private sunEntity: ECSEntity;
  private earthEntity: ECSEntity;

  private answerInputBox: HTMLInputElement;
  private submitButton: HTMLButtonElement;

  constructor(htmlContainer: HTMLDivElement) {
    const app = new PIXI.Application();
    const environment = new NBodySystemEnvironment(app);
    environment.scaleFactor = 2e-9;
    super(htmlContainer, environment);

    // set up systems
    this.systems = [
      new GravitySystem(this.entityManager, this.environment),
      // new MoveParticleSystem(this.entityManager, this.environment),
      new SelectableItemSystem(this.entityManager, this.environment),
      new DraggableItemSystem(this.entityManager, this.environment),
      new RendererSystem(this.entityManager, this.environment),
      new ShowVectorSystem(this.entityManager, this.environment),
      new ShowDistanceSystem(this.entityManager, this.environment),
    ];

    // set up entities
    this.earthEntity = addCelestialBody(this.entityManager, {
      mass: EARTH_MASS,
      color: EARTH_COLOR,
      radius: 20,
      fixed: true,
      initialPos: this.initialEarthPos,
    });
    this.sunEntity = addCelestialBody(this.entityManager, {
      mass: SUN_MASS,
      color: SUN_COLOR,
      radius: 25,
      fixed: true,
      initialPos: this.initialSunPos,
      showDistData: [new ShowDistanceData(this.earthEntity)],
    });

    // set up UI
    this.answerInputBox = document.getElementById(
      "forces-answer-box"
    )! as HTMLInputElement;
    this.submitButton = document.getElementById(
      "forces-submit-button"
    )! as HTMLButtonElement;

    this.submitButton.onclick = () => {
      const input = this.answerInputBox.value;
      console.log(input);
      if (input == "") {
        this.answerInputBox.classList.add("red-border");
        return;
      }
      const parsed = Number(input);
      if (isNaN(parsed)) {
        this.answerInputBox.classList.add("red-border");
        return;
      }
      this.answerInputBox.classList.remove("red-border");
      if (parsed == ANSWER) {
        this.goalMetStatus.success("Congratulations");
      } else {
        this.goalMetStatus.failure(this.failureMessage(parsed));
      }
    };
  }

  reset(): void {
    super.reset();

    const earthParticleComponent =
      this.entityManager.getComponent<ParticleComponent>(
        this.earthEntity,
        ParticleComponent
      )!;
    earthParticleComponent.pos = this.initialEarthPos;
    const sunParticleComponent =
      this.entityManager.getComponent<ParticleComponent>(
        this.sunEntity,
        ParticleComponent
      )!;
    sunParticleComponent.pos = this.initialSunPos;

    this.answerInputBox.value = "";
    this.answerInputBox.classList.remove("red-border");
  }

  readonly goalMessage = `Figure out the relationship between F and r`;

  private get initialEarthPos(): Vec2 {
    const app = this.environment.app;
    const scaleFactor = this.environment.scaleFactor;
    return new Vec2(
      app.renderer.width / 2 / scaleFactor - ASTRONIMICAL_UNIT / 2,
      app.renderer.height / 2 / scaleFactor
    );
  }
  private get initialSunPos(): Vec2 {
    const app = this.environment.app;
    const scaleFactor = this.environment.scaleFactor;
    return new Vec2(
      app.renderer.width / 2 / scaleFactor + ASTRONIMICAL_UNIT / 2,
      app.renderer.height / 2 / scaleFactor
    );
  }

  private failureMessage(a: number): string {
    if (!Number.isInteger(a)) {
      return "Hint: the correct answer is an integer";
    }
    if (a == 0) {
      return "A value of 0 means that F is not related to r at all...";
    }
    if (a > 4) {
      return "That number is way too big. Try again";
    }
    if (a < -4) {
      return "That number is way too small. Try again";
    }
    return "That wasn't it, try again";
  }
}
