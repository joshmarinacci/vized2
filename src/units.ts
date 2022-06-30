import {Unit} from "./common";

export function unit_abbr(unit: Unit) {
    if (unit === Unit.Centimeter) return "cm"
    if (unit === Unit.Pixels) return "px"
    if (unit === Unit.Inch) return "in"
    return ""
}

//DPI = 90
//pixels per cm =
//inch => cm is 2.54
//90 pixels per inch is 2.54*90 pixels per cm
//90 pix = 1 inch
//2.54cm = 1 inch = 90px
const inch_to_px = 90
const inch_to_cm = 2.54
const cm_to_inch = 1 / 2.54

export function convert_unit(value: number, from: Unit, to: Unit) {
    // console.log(`converting ${value} from ${from} to ${to}`)
    if (from === Unit.Centimeter && to === Unit.Pixels) {
        return value * cm_to_inch * inch_to_px
    }
    return value
}
