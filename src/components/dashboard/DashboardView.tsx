<div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
  <div className="text-xs text-slate-500 font-medium">Cash on Hand (Vault / Register)</div>
  <div className={`text-2xl font-bold font-heading mt-1 ${dynamicCashOnHand < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
    {formatCurrency(dynamicCashOnHand)}
  </div>
  <div className="text-[11px] text-slate-400 mt-0.5">Physical un-deposited currency</div>
</div>

{/* Strict Financial Rule Advisory */}
<div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
  <AlertCircle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
  <div>
    <span className="font-bold">Accounting Rule Enforced: </span>
    <span>
      Recording a bank deposit transfers funds from <strong>Cash on Hand</strong> to the designated{' '}
      <strong>Bank Account</strong>. It will NEVER be counted twice as egg sales revenue. Total farm revenue is
      strictly derived from Customer Sales & Collections.
    </span>
  </div>
</div>