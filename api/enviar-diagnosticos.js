// Redirect antigo /enviar-diagnosticos para /buscar-enviar (backward compatibility)
module.exports = async (req, res) => {
  res.redirect(301, '/buscar-enviar');
};
