/* Fallback offline — usado se a API falhar. 30 dias simulados.
   O dashboard já embute esta mesma lógica inline; este arquivo
   serve de referência / fonte editável. */
window.DATASET_FALLBACK = (function () {
  const days = [], dow = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'], today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const wknd = (d.getDay() === 0 || d.getDay() === 6), s = Math.sin(i*1.7)*0.5+0.5;
    const gB = Math.round((wknd?180:260)+s*90), fB = Math.round((wknd?150:210)+s*80);
    const gL = Math.max(3, Math.round(gB/(16+s*6))), fL = Math.max(2, Math.round(fB/(19+s*7)));
    days.push({ date:d, day:dow[d.getDay()], gBudget:gB, fBudget:fB, gLeads:gL, fLeads:fL,
      gCpl:gB/gL, fCpl:fB/fL });
  }
  return days;
})();
