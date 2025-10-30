import { Simulation } from "./simulation.js";
import { ControlsInitialisation } from "./controls_initialisation.js";
import { config } from "./config.js";

const simulation = new Simulation(canvas, config);
new ControlsInitialisation(config, simulation);
simulation.init();
