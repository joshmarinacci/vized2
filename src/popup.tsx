import React, {useContext, useEffect, useState} from "react";
import {Point} from "./common";

export interface PopupContextInterface {
    show(content:JSX.Element, e:any):void
    hide():void
    on(cb:any):void
    off(cb:any):void
}

export const PopupContext = React.createContext<PopupContextInterface | null>(null);

export class PopupContextImpl implements PopupContextInterface {
    private listeners: any[];

    constructor() {
        this.listeners = []
    }

    show(content: JSX.Element, e: any): void {
        (e as MouseEvent).preventDefault()
        this.listeners.forEach(cb => cb("show",content, e))
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

export function PopupContainer() {
    let pc = useContext(PopupContext)
    const [content, set_content] = useState(null)
    const [pos, set_pos] = useState(new Point(0, 0))
    useEffect(() => {
        const op = (type:string, v: any, e: any) => {
            if(type === 'show') {
                let evt: MouseEvent = e as MouseEvent
                set_content(v)
                set_pos(new Point(evt.clientX, evt.clientY))
            }
            if(type === 'hide') {
                set_content(null)
            }
        }
        pc?.on(op)
        return () => {
            pc?.off(op)
        }
    })
    let style = {
        left: pos.x,
        top: pos.y
    }
    let ct = content?<div style={style} className={"popup-container visible"}>{content}</div>:<div style={style} className={"popup-container hidden"}>should be hidden</div>
    return <div className={'popup-wrapper ' + (content?"visible":"hidden")}>
        <div className={"popup-scrim"} onClick={()=>{
            set_content(null)
        }
        }></div>
        {ct}
    </div>
}
