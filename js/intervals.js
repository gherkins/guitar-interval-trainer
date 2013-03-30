var sounds      = {}
, lock = false
, challenge = []
, challengeData = {}
, responseElement = null

, guesses = 0
, score = 0
, streak = 0

, intervals = {
  active : {
    1 : {
      name : 'minor second',
      ST   : 1
    },
    2 : {
      name : 'major second',
      ST   : 2
    },
    3 : {
      name : 'minor third',
      ST   : 3
    },
    4 : {
      name : 'major third',
      ST   : 4
    },
    5 : {
      name : 'perfect fourth',
      ST   : 5
    },
    6 : {
      name : 'diabolus in musica',
      ST   : 6
    },
    7 : {
      name : 'perfect fifth',
      ST   : 7
    },
    8 : {
      name : 'minor sixth',
      ST   : 8
    },
    9 : {
      name : 'major sixth',
      ST   : 9
    },
    10 : {
      name : 'minor seventh',
      ST   : 10
    },
    11 : {
      name : 'major seventh',
      ST   : 11
    },
    12 : {
      name : 'octave',
      ST   : 12
    }
  },
  inactive : {}
};


$(document).ready(function(){
  
  
  $(".alert-message").alert();
        
  soundManager.url = 'swf/';
  soundManager.waitForWindowLoad = false;
  soundManager.consoleOnly = true;
  soundManager.debugMode = false;
  soundManager.onready(function(){
    setChallenge();
  });
        
  //user response
  $('.fret').click(function(){
          
    //exit if locked
    if( lock == true){
      return false;
    }
    lock = true;

    responseElement = $(this);

    var response = $(this).data('audio-id');
    
    //create respose sound...
    createSoundIfNotExists(response);
           
    //respond with selected fret
    respond(response);
    
    return true;
    
  });
        
  //play notes
  $('.play').click(function(){
    //replay challenge notes
    playChallenge();
  });
  
  $('input.all').change(function(){
    //check all
      if( $(this).attr('checked') == 'checked' ){
        $('input.interval').prop('checked', true).change();
      }
      //remove all
      else{
        $('input.interval').prop('checked', false).change();
      }
  });
  
  //activate/devactivate intervals
  $('input.interval').change(function(){
    //add
    if( $(this).attr('checked') == 'checked' ){
      intervals.active[$(this).val()] = intervals.inactive[$(this).val()];
      delete intervals.inactive[$(this).val()];
    }
    //remove
    else{
      intervals.inactive[$(this).val()] = intervals.active[$(this).val()];
      delete intervals.active[$(this).val()];
    }
    
    if( $('input.interval:checked').size() == 0 ){
      $('input.interval.min').prop('checked', true).change();    
    }
    
  });
  
});
  
  
  
  
function setChallenge()
{
  
  //reset interval checkbox highlighting
  $('ul.inputs-list label span').removeClass('right');
  
  //clear note names
  $('.fret span.note_name').html('');
  
  //remove fret dots
  $('.fret .dot').removeClass('green').removeClass('wrong').removeClass('right').removeClass('dimmed');
  
  //setup challenge
  var frets = $(".fret.challenge");
  var fret = frets[Math.floor(Math.random()*frets.length)];
  fret = $(fret);
        
  fret.find('.dot').addClass('green');

  fillNoteName(fret);
        
  challengeData = getRandomInterval();
        
  var root = fret.data('audio-id');
  challenge = [root, (root + challengeData.ST)];
  
  //create both challenge notes
  createSoundIfNotExists(challenge[0]);
  createSoundIfNotExists(challenge[1]);
  
  //play the challenge
  playChallenge();
  
  //unlock
  lock = false;
}
 
 
//play both notes
function playChallenge()
{
  if( sounds[challenge[0]].loaded == false || sounds[challenge[1]].loaded == false ){
    setTimeout( "playChallenge();", 100 );
    return;
  }
  
  soundManager.play('sound'+challenge[0], {
    onfinish: function(){
      soundManager.play('sound'+challenge[1]);
    }
  });
}
    
    
//fret clicked - trigger response
function respond( response )
{
  if( sounds[response].loaded == false ){
    setTimeout( "respond("+response+");", 100 );
    return;
  }
  
  fillNoteName(responseElement);
  
  //...and play it, then reset the challenge when done.
  soundManager.play('sound'+response, {
    onfinish : function(){
      setTimeout("setChallenge();", 1200);
    }
  });

  //highlight interval checkbox
  $('ul.inputs-list label span.st_'+challengeData.ST).addClass('right');
  
  $('.fret[data-audio-id="'+challenge[1]+'"] .dot').addClass('right').addClass('dimmed');
//  .each(function(){
//    fillNoteName($(this).parent() );
//  });
  
  
  //RIGHT
  if( challenge[1] == response ){
    updateScores( 1 );
    responseElement.find('.dot').addClass('right').removeClass('dimmed');
  }
  //WRONG
  else{
    updateScores( 0 );
    responseElement.find('.dot').addClass('wrong');
  }
  
}


//return one random active interval
function getRandomInterval()
{
  var result;
  var count = 0;
  for (var prop in intervals.active)
    if (Math.random() < 1/++count)
      result = intervals.active[prop];
  return result;
}


//fill span in fret with latin note name
function fillNoteName( fret )
{
  fret.find('span.note_name').html( fret.data('note-name') );
}
      
      
function createSoundIfNotExists( audioId )
{
  //init sounds if not already done
  if ( sounds[audioId] == undefined )
  {
    //try to use ogg files
    if( soundManager.canPlayMIME( "audio/ogg" ) ){
      sounds[audioId] = soundManager.createSound({
        id: "sound"+audioId,
        url: "audio/ogg/"+parseInt(audioId)+".ogg",
        autoLoad: true,
        autoPlay: false
      });
    }
    //then fallback to mp3... might result in flash usage...
    else{
      sounds[audioId] = soundManager.createSound({
        id: "sound"+audioId,
        url: "audio/mp3/"+parseInt(audioId)+".mp3",
        autoLoad: true,
        autoPlay: false
      });
    }
  }
}


//update scores on response
function updateScores( points )
{
  if( points > 0 ){
    streak++;
  }
  else{
    streak = 0;
  }
  guesses++;
  score = score + points;
  updateScoreDisplay();
}


//update percents, achievements & meters
function updateScoreDisplay()
{
  
  var percent = getPercentage();
  
  //meters
  
  $('.meters .led').hide();
  if (percent >= 10){
    $('.meters .led_10').show();
  }
  if (percent >= 20){
    $('.meters .led_20').show();
  }
  if (percent >= 30){
    $('.meters .led_30').show();
  }
  if (percent >= 40){
    $('.meters .led_40').show();
  }
  if (percent >= 50){
    $('.meters .led_50').show();
  }
  if (percent >= 60){
    $('.meters .led_60').show();
  }
  if (percent >= 70){
    $('.meters .led_70').show();
  }
  if (percent >= 80){
    $('.meters .led_80').show();
  }
  if (percent >= 90){
    $('.meters .led_90').show();
  }
  if (percent == 100){
    $('.meters .led_100').show();
  }
  
  $('.percent .number').html( percent );
  $('.guesses .number').html( guesses );
  
  //achievements
  
//  if( streak < 10 ){
//    $('.achievements .achievement').fadeOut();
//  }
//  
//  if( streak >= 10 && streak < 50 ){
//    $('.achievements .achievement').hide();
//    $('.achievements .bronze').show();
//  }
//  
//  if( streak >= 50 && streak < 100 ){
//    $('.achievements .achievement').hide();
//    $('.achievements .silver').show();
//  }
//  
//  if( streak >= 100 ){
//    $('.achievements .achievement').hide();
//    $('.achievements .gold').show();
//  }
//  
//  $('.streak .number').html( streak );
}


//get percentage of correct answers
function getPercentage()
{
  var percent = (score * 100) / guesses;
  return Math.round( percent );
}