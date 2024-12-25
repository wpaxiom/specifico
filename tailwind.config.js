/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,js}",
    ],
    theme: {
        extend: {
            content: {
                'checked': 'url("../../img/checked-img.svg")',
                'partial-checked': 'url("../../img/partial-checked-img.svg")',
            },
            backgroundImage: {
                'dash-border': 'url("../../img/dash-border.svg")',
                'caret': 'url("../../img/caret.svg")',
            },
            backgroundColor: {
                'option': 'rgba( 0, 0, 0, .3 )'
            }
        }
    },
    plugins: [
    ]
}