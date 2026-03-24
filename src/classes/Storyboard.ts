// MediaFolder.ts
import { makeObservable } from "mobx";
import { LocalFolder } from "./fileSystem/LocalFolder";

export class Storyboard extends LocalFolder {

    constructor(parentFolder: LocalFolder | null, handle: FileSystemDirectoryHandle) {
        super(parentFolder, handle)

        makeObservable(this, {

        });
    }


}
