import React, {useContext, useEffect, useState} from "react";
import "./dialog.css"
export interface DialogContextInterface {
    show(content:JSX.Element, e:any):void
    hide():void
    on(cb:any):void
    off(cb:any):void
}
// @ts-ignore
export const DialogContext = React.createContext<DialogContextInterface>();

export class DialogContextImpl implements DialogContextInterface {
    private listeners: any[];

    constructor() {
        this.listeners = []
    }

    show(content: JSX.Element): void {
        this.listeners.forEach(cb => cb("show",content))
    }
    hide():void {
        this.listeners.forEach(cb => cb("hide"))
    }

    off(cb: any): void {
        this.listeners = this.listeners.filter(c => c !== cb)
    }

    on(cb: any): void {
        this.listeners.push(cb)
    }
}

export function DialogContainer() {
    let dc = useContext(DialogContext)
    const [content, set_content] = useState(null)
    useEffect(() => {
        const op = (type:string, v: any) => {
            if(type === 'show') set_content(v)
            if(type === 'hide') set_content(null)
        }
        dc.on(op)
        return () => dc.off(op)
    })
    const hide = () => set_content(null)
    // @ts-ignore
    const noop = (e) => {
        e.stopPropagation()
    }
    return <div className={'dialog-wrapper ' + (content?"visible":"hidden")}>
        <div className={"dialog-scrim"} onClick={hide}>
            <div className={"dialog-container"} onClick={noop}>
                {content?content:""}
            </div>
        </div>
    </div>
}
