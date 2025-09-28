import { PageLabel } from "../define";

export default abstract class Page {
    protected callback?: (data?: any, page?: PageLabel) => void;

    constructor(protected root: HTMLElement) { }

    abstract setCallback(callback: any): void;

    abstract changePage(data?: any): void;
}