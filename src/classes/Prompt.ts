import { makeAutoObservable, toJS } from "mobx";
import { Project } from "./Project";

class Prompt {
  model: string | null = null;
  prompt: string | null = null;
  system_message: string | null = null;
  presetName: string = ""; // store only the preset name
  project: Project;
  onSave: () => void = () => {};

  constructor(data: any, project: Project, onSave?: () => void) {
    this.project = project;
    if (onSave) this.onSave = onSave;

    // Make the entire object auto-observable
    makeAutoObservable(this);

    // Initialize observables
    this.model = data?.model ?? null;
    this.prompt = data?.prompt ?? null;
    this.system_message = data?.system_message ?? null;
    this.presetName = data?.preset ?? "";
  }

  /** Action methods */
  setModel(value: string) {
    this.model = value;
  }

  setPrompt(value: string) {
    this.prompt = value;
  }

  setSystemMessage(value: string) {
    this.system_message = value;
  }

  /** Set the preset name */
  applyPreset(presetName: string) {
    this.presetName = presetName;
    this.model = null;
    this.prompt = null;
    this.system_message = null;
  }

  /** Getters that return preset values if field is null */
  get modelValue() {
    if (this.model !== null) return this.model;
    if (this.presetName) {
      const preset = toJS(this.project.promptPresets[this.presetName]) || {};
      return preset.model ?? "";
    }
    return "";
  }

  get promptValue() {
    if (this.prompt !== null) return this.prompt;
    if (this.presetName) {
      const preset = toJS(this.project.promptPresets[this.presetName]) || {};
      return preset.prompt ?? "";
    }
    return "";
  }

  get systemMessageValue() {
    if (this.system_message !== null) return this.system_message;
    if (this.presetName) {
      const preset = toJS(this.project.promptPresets[this.presetName]) || {};
      return preset.system_message ?? "";
    }
    return "";
  }

  /** Getter that returns the preset name + fields differing from the preset */
  get data_changed() {
    const result: any = { preset: this.presetName || undefined };

    const preset = this.presetName ? toJS(this.project.promptPresets[this.presetName]) || {} : {};

    if (this.model !== null && this.model !== preset.model) result.model = this.model;
    if (this.prompt !== null && this.prompt !== preset.prompt) result.prompt = this.prompt;
    if (this.system_message !== null && this.system_message !== preset.system_message)
      result.system_message = this.system_message;

    return result;
  }

  /** Returns all data, using preset fallback if fields are null */
  get data() {
    return {
      preset: this.presetName || undefined,
      model: this.modelValue,
      prompt: this.promptValue,
      system_message: this.systemMessageValue,
    };
  }

  /** Log current state */
  log() {
    console.log(toJS(this));
  }

  /** Trigger onSave callback */
  save() {
    this.onSave();
  }

  /** Save current data as preset */
  savePreset(newName:string | null = null ) {
    const _data:any = this.data;
    if (newName) _data.preset = newName;
    this.project.savePromptPreset(_data);    
    if (newName) this.applyPreset(newName);
  }
}

export default Prompt;
