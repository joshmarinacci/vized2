import {Point, Rect, Unit} from "./common";

export function unit_abbr(unit: Unit) {
    if (unit === Unit.Centimeter) return "cm"
    if (unit === Unit.Pixels) return "px"
    if (unit === Unit.Inch) return "in"
    return "xxxx"
}

const inch_to_px = 90
const inch_to_cm = 2.54
const cm_to_inch = 1 / 2.54
const points_per_inch = 72
const pixels_per_point = 1
const points_per_point = 1

function get_ratio_to_points(from:Unit):number {
    if(from === Unit.Pixels) return pixels_per_point
    if(from === Unit.Point) return points_per_point
    if(from === Unit.Inch) return points_per_inch
    if(from === Unit.Centimeter) return cm_to_inch*points_per_inch
    throw new Error(`cannot get ratio of unit ${unit_abbr(from)}`)
}


export function convert_unit(value: number, from: Unit, to: Unit) {
    if (from === Unit.Centimeter && to === Unit.Pixels) {
        return value * cm_to_inch * inch_to_px
    }
    return value
}


export function transform_scalar_from_unit_to_points(scalar:number, from:Unit) {
    return scalar * get_ratio_to_points(from)
}
export function transform_point_from_unit_to_points(point: Point, from: Unit) {
    return point.multiply(get_ratio_to_points(from))
}

export function transform_rect_from_unit_to_points(rect: Rect, from: Unit) {
    return rect.scale(get_ratio_to_points(from))
}
