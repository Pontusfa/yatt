var modelModule = require(process.cwd() + '/src/pages/torrents/torrentsModel'),
mocks = require(process.cwd() + '/spec/mocks'),
query = {
    criteria:{
         a: ' ',
        b: 'bb  b ',
        c: ['a ', ' bb', ''],
        d: []
    },
    offset: 0
},
model = null,
Model = null;

mocks = require(process.cwd() + '/spec/mocks');

describe('Torrents model', function(){
    it('initiates', function(){
        Model = modelModule(mocks.queries);
        expect(Model).toBeDefined();
    });

    it('creates a Model object', function(){
        model = new Model(query);

        expect(model).toBeDefined();
        expect(model).toEqual(jasmine.objectContaining({
            _query: query,
            _offset: query.offset,
            _sortBy: {},
            _criteria: {},
            _callbacks: {}
        }));
    });

    it('registers callbacks',function(){
        var callbacks = { getTorrents: function(){},
                       getPages: function(){}};
        
        model.registerCallbacks(callbacks);
        expect(model._callbacks).toEqual(callbacks);
        for(callback in model._callbacks){
            expect(typeof model._callbacks[callback]).toEqual('function');
        }
    });

    it('trims criteria', function(){
        var trimmedCriteria = {
            b: ['bb', 'b'],
            c: ['a', 'bb'],
        };
       
        model.trimCriteria();
        expect(model._criteria).toEqual(trimmedCriteria);
    });

    it('builds criteria', function(){
        var oldCriteria = model._criteria;
        model.buildCriteria();
        expect(model._criteria).toEqual({
            $and: [{seeders: {$gt: 0}}]
        });

        model._criteria = {
            deadtorrents: '1',
            tags: ['a', 'b'],
            title: ['alice'],
            categories: ['aa', 'bb']
        };
        model.buildCriteria();
        expect(model._criteria).toEqual({
            $and: [
                {tags: {$all: ['a', 'b']}},
                {title: {$regex: /alice/i}},
                {$or: [{category: 'aa'}, {category: 'bb'}]}
            ]
        });
        model._criteria = oldCriteria;
    });

    it('builds sort', function(){
        model.buildSort();
        expect(model._sortBy).toEqual({
            'created': -1
        });

        model._sortBy = [];
        model._query.order = 'desc';
        model.buildSort();
        expect(model._sortBy).toEqual({
            'created': 1
        });

        model._sortBy = [];
        model._query.sort = 'leechers';
        model.buildSort();
        expect(model._sortBy).toEqual({
            'leechers': 1
        });

        model._sortBy = [];
        model._query.order = 'asc';
        model.buildSort();
        expect(model._sortBy).toEqual({
            'leechers': -1
        });
    });

    it('gets torrents', function(){
        var docs = [{name: 'a', len: 143, created: new Date()}, {name: 'bb', len: -1}],
        err = null,
        torrs = [
                {name: 'a', len: 143, created: new Date().toLocaleDateString(), new: true},
                {name: 'bb', len: -1, created: 'Invalid Date'}
        ];
        
        spyOn(mocks.queries, 'getDocuments').andCallFake(function(c, t, s, l, w, x, callback){
            callback(err, docs);
        });
        model._callbacks.getTorrents = (function(error, torr){
            expect(error).toEqual(err);
            
            expect(torr).toEqual(torrs);
        });
        
        model.getTorrents();

        err = {type: 'error', message: 'failedSearch'};
        torrs = null;
        model.getTorrents();
    });

    it('gets pages', function(){
        var count = 3,
        res = {previous: null, next: null},
        err = null,
        alrt = null;
        
        spyOn(mocks.queries, 'countCollection').andCallFake(function(q, c, callback){
            callback(err, count);
        });

        model._callbacks.getPages = function(alert, result){
            expect(result).toEqual(res);
            expect(alert).toEqual(alrt);
        };
        model.getPages();

        err = {};
        alrt = {type: 'error', message: 'databaseFail'};
        res = {};
        model.getPages();

        err = null;
        alrt = null;
        count = 8;
        res = {previous: null, next: 5};
        model.getPages();

        model._offset = 1;
        res = {previous: 0, next: 6};
        model.getPages();

        count = 3;
        res = {previous: 0, next: null};
        model.getPages();
    });
});
