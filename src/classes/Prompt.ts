import { makeAutoObservable, toJS,runInAction } from "mobx";
import { Project } from "./Project";
import { ChatGPT } from "./ChatGPT";

class Prompt {
  project: Project;
  isLoading: boolean = false;
  data_local: Record<string, string> = {};
  onSave: () => void = () => {};
  modifyData: (data: any) => any = (data) => {return data};
  onGenerate: (res: any) => void = ()=>{};


  constructor(data: any, project: Project, onSave?: () => void) {
    this.project = project;
    if (onSave) this.onSave = onSave;

    // Make the entire object auto-observable
    makeAutoObservable(this);

    // Initialize observables
    this.data_local = data;
  }

  /** Action methods */
  setModel(value: string) { this.data_local.model = value; }
  setPrompt(value: string) {this.data_local.prompt = value;}
  setSystemMessage(value: string) { this.data_local.system_message = value; }
  setValue(key:string,value:string){ this.data_local[key] = value; }

  /** Set the preset name */
  applyPreset(preset: string) {this.data_local = {preset:preset};}

  get data() {
    const preset = toJS(this.project.promptPresets[this.data_local.preset]) || {};
    return {...preset,...this.data_local };
  }

  log() { console.log(toJS(this)); }
  save() { this.onSave(); }

  /** Save current data as preset */
  savePreset(newName:string | null = null ) {
    const _data:any = this.data;
    if (newName) _data.preset = newName;
    this.project.savePromptPreset(_data);    
    if (newName) this.applyPreset(newName);
  }

  async generate(){
    runInAction(() => { this.isLoading = true; });
    try {
      let data: any = this.data;
      data = this.modifyData(data);

      console.log(data);
      const res = await ChatGPT.txt2txt(data.prompt, data.system_message,data.model);

      this.onGenerate(res);
      return res;
    } catch (err) {
      console.error("Error generating:", err);
      return null;
    } finally {
      runInAction(() => { this.isLoading = false; });
    }
  }
}

export default Prompt;
