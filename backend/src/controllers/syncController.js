const mondayService = require('../services/mondayService');
const mailchimpService = require('../services/mailchimpService');

exports.syncMondayMailchimp = async (req, res) => {
    const { mondayBoardId, mailchimpListId } = req.body;
    
    if (!mondayBoardId || !mailchimpListId) {
        return res.status(400).json({ message: "Faltan los IDs de Monday o Mailchimp" });
    }

    try {
        const itemIds = await mondayService.getItemIds(mondayBoardId);
        if (itemIds) {
            const columnValuesData = await mondayService.getItemColumnValues(itemIds);
            const syncResults = await mailchimpService.updateMailchimp(columnValuesData, mailchimpListId);
            res.json({ 
                message: "Sincronización completada con éxito",
                syncResults: syncResults
            });
        } else {
            res.status(400).json({ message: "No se pudieron obtener los IDs de los ítems" });
        }
    } catch (error) {
        console.error(`Error en la sincronización: ${error.message}`);
        res.status(500).json({ message: `Error en la sincronización: ${error.message}` });
    }
};