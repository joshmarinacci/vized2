import {Point, Rect, Unit} from "./common";

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
const points_per_inch = 72
const points_per_point = 1

export function convert_unit(value: number, from: Unit, to: Unit) {
    if (from === Unit.Centimeter && to === Unit.Pixels) {
        return value * cm_to_inch * inch_to_px
    }
    return value
}

export function unit_to_points(value:number, from:Unit) {
    if (from === Unit.Inch) return value*points_per_inch
    throw new Error(`cannot convert unit ${unit_abbr(from)}`)
}

export function transform_scalar_from_unit_to_points(scalar:number, from:Unit) {
    if (from === Unit.Inch) return scalar * points_per_inch
    if (from === Unit.Point) return scalar * points_per_point
}
export function transform_point_from_unit_to_points(point: Point, from: Unit) {
    if (from === Unit.Inch) return point.multiply(points_per_inch)
    if (from === Unit.Point) return point.multiply(points_per_point)
    throw new Error(`cannot convert point from unit ${unit_abbr(from)}`)
}

export function transform_rect_from_unit_to_points(rect: Rect, from: Unit) {
    if (from === Unit.Inch) return rect.scale(points_per_inch)
    if (from === Unit.Point) return rect.scale(points_per_point)
    throw new Error(`cannot convert rect from unit ${unit_abbr(from)}`)
}
