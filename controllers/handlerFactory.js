const AppError = require('../utils/AppError');
const catchAsyncError = require('../utils/catchAsyncError');
const APIFeatures = require('../utils/APIFeatures');

//Implementation using factory method design pattern

exports.getOneDoc = (Model, populateOptions) =>
    catchAsyncError(async (req, res, next) => {
        let query = Model.findById(req.params.id); //query not awaited in other to manipulate it further
        if (populateOptions) query = query.populate(populateOptions);
        const doc = await query;
        //
        if (!doc) {
            return next(new AppError(`No results found for id: ${id}`, 404));
        }
        //
        res.status(200).json({ status: 'Sucess', data: { data: { doc } } });
    });

exports.getAllDocs = (Model) =>
    catchAsyncError(async (req, res, next) => {
        let apiFeatures = new APIFeatures(Model.find(), req.query);
        apiFeatures = apiFeatures.fliter().sortQry().limitFields().paginate();
        //ExECUTE QUERY NOW
        const docs = await apiFeatures.query; //await ensures that all these query resolves with real data
        res.status(200).json({
            status: 'Success',
            results: docs.length,
            data: { data: docs },
        });
    });

exports.createOneDoc = (Model) =>
    catchAsyncError(async (req, res, next) => {
        //
        const doc = await Model.create(req.body);
        res.status(200).json({ status: 'Sucess', data: { data: { doc } } });
    });

//NB: Don't change password using this middleware
exports.updateOneDoc = (Model) =>
    catchAsyncError(async (req, res, next) => {
        const { id } = req.params;
        //NB: to use this for updating reviews, the url needs little modification; also, reviewId --> id
        const doc = await Model.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });
        //
        if (!doc) {
            return next(new AppError(`No results found for id: ${id}`, 404));
        }
        //
        res.status(200).json({ status: 'Sucess', data: { data: { doc } } });
    });

exports.deleteOneDoc = (Model) =>
    catchAsyncError(async (req, res, next) => {
        const { tourId } = req.params;
        const resp = await Model.findByIdAndDelete(tourId);
        if (!resp)
            return next(
                new AppError(`No results found for id: ${tourId}`, 404)
            );
        return res
            .status(200)
            .json({ status: 'Sucess', resp: 'deleted successfully!' });
    });
