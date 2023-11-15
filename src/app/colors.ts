import * as chroma from "chroma-js";

export const line_color = '#282828'
export const fill_color = '#ffffff'
export const canvas_color = '#ffffff'
export const canvas_color_simulating = '#f6f4eb'

export const min_heat_color = '#fffac8'
export const half_heat_color = '#ffb241'
export const max_heat_color = '#de0000'


export function toHeatColor(value: number): string {
    if (value < 0.2) {
        return chroma.mix(fill_color, min_heat_color, value).hex();
    }
    if (value > 0.6) {
        return chroma.mix(half_heat_color, max_heat_color, value).hex();
    }

    return chroma.mix(min_heat_color, half_heat_color, value).hex();
}
