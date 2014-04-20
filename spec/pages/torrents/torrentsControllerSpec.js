var controllerModule = require(process.cwd() + '/src/pages/torrents/torrentsController'),
mocks = require(process.cwd() + '/spec/mocks'),
getTorrents = null,
req =  {
    query: {
        deadtorrents: '1',
        tags: ['a', 'b'],
        title: 'alice', 
        categories: ['aa', 'bb']
    }
},
res = {
    send: function(){}
},
pageRank = null;

describe('Torrents controller', function(){
    it('initiates', function(){
        spyOn(mocks.app, 'get').andCallFake(function(x, gt){
            getTorrents = gt;
        });
        
        mocks.app.config.site.private = false;
        pageRank = controllerModule.setup(mocks.app, mocks.jadeCompiler, mocks.queries);
        expect(pageRank).toEqual(mocks.app.config.site.ranks.PUBLIC);
        
        mocks.app.config.site.private = true;
        pageRank = controllerModule.setup(mocks.app, mocks.jadeCompiler, mocks.queries);
        expect(pageRank).toEqual(mocks.app.config.site.ranks.MEMBER);
    });

    it('gets request', function(){
        getTorrents(req, res);
    });
});
