import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base'
import { Roles } from 'meteor/alanning:roles'; //https://github.com/Meteor-Community-Packages/meteor-roles
import { itemsCollection } from '../imports/api/items';
import { reservationsCollection } from '../imports/api/reservations';
import { pastReservationsCollection } from '../imports/api/pastReservations';
import { maintenanceCollection } from '../imports/api/maintenance';

//-------TODO--------
// 


async function insertItem({ name,category,reserveDate,returnDate,manUrl,info, status, user,reservation, available }) {
  // check if item manual url includes https:// at start
  if(!manUrl.includes('https://www.')){
    manUrl=`https://www.${manUrl}`
  }
  // insert item to DB
  await itemsCollection.insertAsync({name,category,reserveDate,returnDate,manUrl,info, status, user,reservation, available });
}

async function makeReservation({ name,user,items,resStartDate,resEndDate}) {
  // if reservation name left empty, set name as user, month and number of reservations
  if(name===''){
    let userName=await Meteor.users.findOneAsync(user)
    name=`${resStartDate.getDate()}.${resStartDate.getMonth()+1}.${resStartDate.getUTCFullYear()} ${userName.username}`
  }
  const regex = new RegExp(name, 'i');
  await reservationsCollection.find({
    $or: [
      { name: name }, // Exact match
      { name: { $regex: regex } } // Partial match
    ]
  }).fetchAsync()
    .then(res=>{
    if(res.length!=0){
    name=`${name}, ${res.length}`
    }
  })
  // insert reservation to DB and return resservations _id
  let resID=''
  await reservationsCollection.insertAsync({ name,resStartDate,resEndDate,user, items}).then(res=>resID=res);
  // get reservation doc
  let tmp=await reservationsCollection.findOneAsync({"_id":resID})
  // update item docs in DB 
  items.map(itemToUpdate=>{
    itemsCollection.updateAsync({"_id":itemToUpdate},{"$push":{reservation:tmp}}) 
  })
} 

async function insertItemPastReservation(res,itemsArr){
  reservationsCollection.findOneAsync({"_id":res})
  .then(reservation=>{
    pastReservationsCollection.findOneAsync({"_id":reservation._id})
    .then(res=>{
      if(res!=undefined){
        itemsArr.map(item=>{
          itemsCollection.findOneAsync({"_id":item})
          .then(result=>{
            reservation.items.splice(reservation.items.indexOf(item),1)
            pastReservationsCollection.updateAsync(res._id,{"$push":{"items":result}})
          })
        })
      }else{
        reservation.items.map(item=>{
          itemsCollection.findOneAsync({"_id":item})
          .then(res=>{
            reservation.items.splice(reservation.items.indexOf(item),1)
            reservation.items.push(res)
            pastReservationsCollection.insertAsync(reservation) 
        })
      })
      }
    })
  })
}
 
async function addItemToReservation(itemsArr, reservation, user){
  itemsArr.map(itemToAdd=>{
    reservationsCollection.findOneAsync({_id:reservation})
    .then(res=>{
      reservationsCollection.updateAsync(reservation,{$push:{items:itemToAdd}})
      itemsCollection.updateAsync(itemToAdd,{$set:{reserveDate:new Date()}})
      itemsCollection.updateAsync(itemToAdd,{$push:{reservation:res}})
    })
  })
} 

async function returnItemFromReservation(itemsArr,reservation){
  itemsArr.map(itemToReturn=>{
    itemsCollection.updateAsync(itemToReturn,{"$set":{returnDate:new Date()},"$pull":{"reservation":{"_id":reservation}}})
    reservationsCollection.updateAsync(reservation,{"$pull":{"items":itemToReturn}})
  })
}

async function returnReservations(ResArray){ 
  for(let i=0;i<ResArray.length;i++){
    let tmpreservation = await reservationsCollection.findOneAsync({_id:ResArray[i]}) 
    if(tmpreservation&&tmpreservation.items){
      tmpreservation.items.map(item=>{
        itemsCollection.updateAsync(item,{"$set":{returnDate:new Date()},"$pull":{"reservation":{"_id":tmpreservation._id}}})
  
      })}
    }
  for(let i=0;i!=ResArray.length;i++){
    await reservationsCollection.removeAsync({_id:ResArray[i]})
  } 
}

async function checkAdminAccount(){
  if(!(await Accounts.findUserByUsername('admin'))){
    await Accounts.createUserAsync({username:'admin',password:'1234'})
    let admin=await Accounts.findUserByUsername('admin')
    await Roles.addUsersToRolesAsync(admin._id,'admin')
  }
}

async function setUserRole(userID,role) {
  await Roles.addUsersToRolesAsync(userID,role)
}

async function returnItemToMaintenance(itemsArr,reservation, info){
  itemsArr.map(itemToReturn=>{
    //Tässä palautetaan item pastReservation Collectioniin.
    //
    // Käytä servun omaa async funktiota
    //
    itemsCollection.updateAsync(itemToReturn,{"$set":{returnDate:new Date(), available:false},"$pull":{"reservation":{"_id":reservation}}}) 
    .then(res=>{
      itemsCollection.findOneAsync({"_id":itemToReturn})
      .then(item=>{
        maintenanceCollection.insertAsync(item)
        .then(res=>{
          maintenanceCollection.updateAsync(itemToReturn,{"$set":{'info':info}})
        })
      })
    })
    reservationsCollection.updateAsync(reservation,{"$pull":{"items":itemToReturn}})
  })
}

async function returnItemAvailable(item){
  maintenanceCollection.removeAsync({"_id":item})
  itemsCollection.updateAsync(item, {"$set":{available:true}})
}

Meteor.startup(async () => {

  // Add roles to database
  if(await Meteor.roles.find().countAsync()===0){ 
    Roles.createRoleAsync('user');
    Roles.createRoleAsync('admin');
  }

  checkAdminAccount();
  
  // Accounts config
  Accounts.config({loginExpiration:6000000}) //10min token exp time

  Meteor.publish(null, function () {
    if (this.userId) {
      return Meteor.roleAssignment.find({ 'user._id': this.userId });
    } else {
      this.ready()
    }
  })

  Meteor.publish('items', function(){
    if(this.userId){
      return itemsCollection.find();
    }else{
      this.ready();
    }
  })

  Meteor.publish('reservations', function(){
    if(this.userId){
      return reservationsCollection.find();
    }else{
      this.ready();
    }
    
  })

  Meteor.publish('pastReservations', function(){
    if(this.userId){
      return pastReservationsCollection.find();
    }else{
      this.ready();
    }
    
  })

  Meteor.publish("allUserData", function () {
    if(this.userId&&Roles.userIsInRoleAsync(this.userId, 'admin')){
      return Meteor.users.find({}, {fields: {'_id': 1, 'username':1}});
    }
  })

  Meteor.publish('maintenance', function(){
    if(this.userId&&Roles.userIsInRoleAsync(this.userId, 'admin')){
      return maintenanceCollection.find();
    }
    else{
      this.ready();
    }
  })

  Meteor.methods({

    async 'checkAdmin'(user){
      Roles.userIsInRoleAsync(user._id,'admin').then(res=>{return res;});
    },

    async 'createUserServer'(userName,userPassword){
      try{
        await Accounts.createUserAsync({username:userName,password:userPassword}).then(res=>{
          if (res){
            console.log("User created succesfully")
          }
        })
      }catch(err){
        throw new Meteor.Error('error creating user', err)
      }
      return true;
  },

    async 'setUserRole'(userName,userRole){
      let user = await Meteor.users.findOneAsync({'username':userName})
      try{
        await setUserRole(user._id,userRole)
      }catch(err){
        throw new Meteor.Error('error setting user', err)
      }
    },

    async 'insertItemDB'(name,category,reserveDate,returnDate,manUrl,info, status, user,reservation, available){
      try{      
        await insertItem({
          name:name,
          category:category,
          reserveDate:reserveDate,
          returnDate:returnDate,
          manUrl:manUrl,
          info:info,
          status:status,
          user:user,
          reservation:reservation,
          available:available
        })
      }catch(err){
        throw new Meteor.Error('Error creating item.',err)
      }

    },

    async 'addItemToReservation'(itemsArr,reservation,user){
      try{
        await addItemToReservation(itemsArr,reservation,user)
      }catch(err){
        throw new Meteor.Error('Error adding item to reservation', err)
      }
    },

    async 'returnReservations'(ResArray){
      try{
        await returnReservations(ResArray)
        // insertPastReservation(ResArray)
      }catch(err){
        throw new Meteor.Error('Error returning reservation', err)
      }
    },

    async 'returnItemFromReservartion'(itemsArr,reservation){
      try{
        await insertItemPastReservation(reservation,itemsArr)
        await returnItemFromReservation(itemsArr,reservation) 
      }catch(err){
        throw new Meteor.Error('Error returning item', err)
      }
    },

    async 'makeReservation'(name,user,items,resStartDate,resEndDate){
      try{
        await makeReservation({
          name:name,
          resStartDate:resStartDate,
          resEndDate:resEndDate,
          user:user,
          items:items,
        });
      }catch(err){
        throw new Meteor.Error('error making reservation',err)
      }

    },

    async 'returnItemToMaintenance'(itemsArr,reservation, info){
      console.log(itemsArr)
      try{
        await insertItemPastReservation(reservation,itemsArr)
        await returnItemToMaintenance(itemsArr,reservation,info);
      }catch(err){

      }
    },

    async 'returnItemAvailable'(item){
      try{
        await returnItemAvailable(item)
      }catch(err){

      }
    },

  })
});

