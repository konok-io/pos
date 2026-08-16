<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    public function index(Request $request)
    {
        $query = Sale::with(['customer', 'user', 'items.product']);
        
        if ($request->has('date')) {
            $query->whereDate('date', $request->date);
        }
        
        if ($request->has('from_date') && $request->has('to_date')) {
            $query->whereBetween('date', [$request->from_date, $request->to_date]);
        }
        
        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        DB::beginTransaction();
        
        try {
            $validated = $request->validate([
                'customer_id' => 'nullable|exists:customers,id',
                'subtotal' => 'required|numeric|min:0',
                'discount' => 'nullable|numeric|min:0',
                'vat' => 'nullable|numeric|min:0',
                'total' => 'required|numeric|min:0',
                'paid' => 'required|numeric|min:0',
                'change' => 'nullable|numeric|min:0',
                'payment_method' => 'required|string',
                'notes' => 'nullable|string',
            ]);
            
            $sale = Sale::create([
                'invoice_no' => $request->invoice_no ?? 'INV' . time(),
                'customer_id' => $validated['customer_id'],
                'user_id' => auth()->id() ?? 1,
                'date' => $request->date ?? now()->toDateString(),
                'subtotal' => $validated['subtotal'],
                'discount' => $validated['discount'] ?? 0,
                'vat' => $validated['vat'] ?? 0,
                'total' => $validated['total'],
                'paid' => $validated['paid'],
                'change' => $validated['change'] ?? 0,
                'due' => max(0, $validated['total'] - $validated['paid']),
                'payment_method' => $validated['payment_method'],
                'payment_status' => $validated['paid'] >= $validated['total'] ? 'paid' : 'partial',
                'notes' => $validated['notes'] ?? null,
            ]);
            
            foreach ($request->items as $item) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['id'],
                    'quantity' => $item['quantity'],
                    'unit' => $item['unit'],
                    'price' => $item['price'],
                    'subtotal' => $item['total'],
                ]);
                
                // Update stock
                Product::where('id', $item['id'])->decrement('stock_quantity', $item['quantity']);
            }
            
            DB::commit();
            
            return response()->json($sale->load('items'), 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        return response()->json(Sale::with(['customer', 'user', 'items.product'])->findOrFail($id));
    }

    public function dailyReport(Request $request)
    {
        $date = $request->date ?? now()->toDateString();
        
        $sales = Sale::whereDate('date', $date)->get();
        
        return response()->json([
            'date' => $date,
            'total_sales' => $sales->count(),
            'total_amount' => $sales->sum('total'),
            'total_paid' => $sales->sum('paid'),
            'total_due' => $sales->sum('due'),
            'sales' => $sales,
        ]);
    }

    public function dateRangeReport(Request $request)
    {
        $request->validate([
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
        ]);
        
        $sales = Sale::whereBetween('date', [$request->from_date, $request->to_date])->get();
        
        return response()->json([
            'from_date' => $request->from_date,
            'to_date' => $request->to_date,
            'total_sales' => $sales->count(),
            'total_amount' => $sales->sum('total'),
            'total_paid' => $sales->sum('paid'),
            'total_due' => $sales->sum('due'),
            'sales' => $sales,
        ]);
    }
}
