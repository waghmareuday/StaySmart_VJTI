import React from 'react'

function MessBill() {
  return (
    <>
<div class="bg-gray-900 text-white font-sans">
    <div class="container mx-auto text-center py-10 px-4">
        <h1 class="text-3xl font-bold text-blue-400">Your Mess Bill</h1>

        <table class="w-full max-w-4xl mx-auto mt-8 text-left border-collapse">
            <thead>
                <tr class="bg-blue-500">
                    <th class="p-4 border border-gray-700">S.N.</th>
                    <th class="p-4 border border-gray-700">Month</th>
                    <th class="p-4 border border-gray-700">Meal</th>
                    <th class="p-4 border border-gray-700">Bill</th>
                </tr>
            </thead>
            <tbody>
                <tr class="bg-gray-800 hover:bg-gray-700">
                    <td class="p-4 border border-gray-700">1</td>
                    <td class="p-4 border border-gray-700">January</td>
                    <td class="p-4 border border-gray-700">30</td>
                    <td class="p-4 border border-gray-700">5000/-</td>
                </tr>
                <tr class="bg-gray-800 hover:bg-gray-700">
                    <td class="p-4 border border-gray-700">2</td>
                    <td class="p-4 border border-gray-700">February</td>
                    <td class="p-4 border border-gray-700">25</td>
                    <td class="p-4 border border-gray-700">4500/-</td>
                </tr>
                <tr class="bg-gray-800 hover:bg-gray-700">
                    <td class="p-4 border border-gray-700">3</td>
                    <td class="p-4 border border-gray-700">March</td>
                    <td class="p-4 border border-gray-700">10</td>
                    <td class="p-4 border border-gray-700">4000/-</td>
                </tr>
            </tbody>
            <tfoot>
                <tr class="bg-blue-500">
                    <td colspan="3" class="p-4 border border-gray-700 text-right font-bold">Total:</td>
                    <td class="p-4 border border-gray-700 font-bold">13500/-</td>
                </tr>
            </tfoot>
        </table>
    </div>
</div>

    </>
  )
}

export default MessBill
