import {
    PDFDocument,
    pushGraphicsState,
    moveTo,
    lineTo,
    closePath,
    fill,
    setFillingColor,
    rgb,
    popGraphicsState,
    scale, translate, setStrokingGrayscaleColor, stroke
} from 'pdf-lib'
import fs from "fs"

// PDF Creation
const pdfDoc = await PDFDocument.create()
const page = pdfDoc.addPage([350, 400]);
// page.moveTo(110, 200);

//change the transform to the center
//draw a circle
//revert the transform
//draw three times

function draw_circle(x, y,sc) {
    page.pushOperators(
        pushGraphicsState(),
        translate(x,y),
        scale(sc,sc),
        moveTo(1, 1),
        lineTo(size.width-1, 1),
        lineTo(size.width-1, size.height-1),
        lineTo(0,size.height-1),
        closePath(),
        // setFillingColor(rgb(0.0, 1.0, 0.0)),
        setStrokingGrayscaleColor(0.5),
        stroke(),
        // fill(),
        popGraphicsState(),
    )
}

let size = page.getSize()
draw_circle(0, 0,0.5)
draw_circle(size.width/2, 0,0.5)
draw_circle(0, size.height/2,0.5)
draw_circle(size.width/2, size.height/2,0.5)
// draw_circle(50,100)
// draw_circle(100,100)


//page.drawText('Hello World!');
const pdfBytes = await pdfDoc.save()

fs.writeFileSync("test1.pdf",pdfBytes)
