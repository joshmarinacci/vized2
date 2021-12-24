import {readMetadata, writeMetadata} from "./vendor";

export async function export_png(canvas:HTMLCanvasElement, data:object, filename:string) {
    let json:string = JSON.stringify(data)
    let blob = await canvas_to_blob(canvas)
    let array_buffer = await blob.arrayBuffer()
    let uint8buffer = new Uint8Array(array_buffer)
    // @ts-ignore
    let out_buffer = writeMetadata(uint8buffer as Buffer,{ tEXt: { SOURCE:json,  } })
    let url = buffer_to_dataurl(out_buffer,"image/png")
    force_download(url,filename)
}

export function export_json(buffer:object) {
    let data = JSON.stringify(buffer)
    let url = 'data:application/json;base64,' + btoa(data)
    // force_download(url,'image.json')
}
type Metadata = {tEXt: {keyword: any, SOURCE:any}}

export function import_png(file:Blob):Promise<object> {
    return new Promise((res,rej)=>{
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            let buffer2 = new Uint8Array(reader.result as ArrayBufferLike);
            let metadata:Metadata = readMetadata(buffer2 as Buffer) as unknown as Metadata
            console.log("metadata is", metadata)
            if(metadata && metadata.tEXt && metadata.tEXt.SOURCE) {
                let json = JSON.parse(metadata.tEXt.SOURCE)
                res(json)
            }
        })
        reader.readAsArrayBuffer(file)
    })
}

export function canvas_to_blob(canvas:HTMLCanvasElement):Promise<Blob> {
    return new Promise((res,rej)=>{
        canvas.toBlob(blob => {
            res(blob as Blob)
        })
    })
}

export function buffer_to_dataurl(buffer:object, type:string) {
    let final_blob = new Blob([buffer as BlobPart],{type:type})
    return URL.createObjectURL(final_blob)
}

export function force_download(url:string, filename:string) {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
}


/*
function UploadButton({onUpload}) {
    return <input type={'file'} onChange={(e)=>{
        if(!e.target.files || e.target.files.length < 1) return
        let file = e.target.files[0]
        // console.log("changed",file, file.type)
        if(file.type === "image/png") {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                let buffer2 = new Uint8Array(reader.result);
                let metadata = readMetadata(buffer2)
                console.log("metadata is", metadata)
                if(metadata && metadata.tEXt && metadata.tEXt.SOURCE) {
                    let json = JSON.parse(metadata.tEXt.SOURCE)
                    onUpload(json)
                }
            })
            reader.readAsArrayBuffer(file)
        }
        if(file.type === 'application/json') {
            const reader = new FileReader();
            reader.addEventListener('load', (e) => {
                onUpload(JSON.parse(reader.result))
            })
            reader.readAsText(file)
        }
    }
}/>
}
*/
